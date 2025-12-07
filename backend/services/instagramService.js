const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const sessionsDir = path.join(__dirname, '..', 'sessions');

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function ensureSessionsDir() {
    if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir);
    }
}

function resolveSessionPath(customSessionPath) {
    ensureSessionsDir();

    if (customSessionPath && fs.existsSync(customSessionPath)) {
        return customSessionPath;
    }

    const files = fs.readdirSync(sessionsDir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => path.join(sessionsDir, file));

    if (!files.length) {
        throw new HttpError(401, 'No saved sessions found. Please run `npm run login` first.');
    }

    files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    return files[0];
}

function validateInstagramUrl(rawUrl, type) {
    let parsed;

    try {
        parsed = new URL(rawUrl);
    } catch (error) {
        throw new HttpError(400, 'لینک مشکل داره');
    }

    const hostname = parsed.hostname.replace(/^www\./, '');
    if (!hostname.endsWith('instagram.com')) {
        throw new HttpError(400, 'لینک مشکل داره');
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (!pathParts.length) {
        throw new HttpError(400, 'لینک مشکل داره');
    }

    if (type === 'post') {
        const prefix = pathParts[0];
        if (!['p', 'reel', 'tv'].includes(prefix)) {
            throw new HttpError(400, 'لینک مشکل داره');
        }
    }

    if (type === 'profile') {
        if (['p', 'reel', 'tv', 'stories'].includes(pathParts[0])) {
            throw new HttpError(400, 'لینک مشکل داره');
        }
    }

    return parsed.toString();
}

async function ensureLoggedIn(page) {
    const loginForm = await page.$('form input[name="username"]');
    const isLoginPage = page.url().includes('/accounts/login');
    if (loginForm || isLoginPage) {
        throw new HttpError(401, 'سشن به مشکل خورده. دوباره لاگین کن.');
    }
}

async function checkPrivatePage(page) {
    const bodyText = await page.textContent('body');
    if (bodyText && bodyText.toLowerCase().includes('this account is private')) {
        throw new HttpError(403, 'پیج پرایوته');
    }
}

// مهم: طبق درخواست تو، فقط headless: false
async function withBrowser(sessionPath, handler) {
    const browser = await chromium.launch({
        headless: false,
        args: ['--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
        storageState: sessionPath,
        viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    try {
        return await handler(page);
    } catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }

        if (error.message && error.message.toLowerCase().includes('storage state')) {
            throw new HttpError(401, 'سشن به مشکل خورده. دوباره لاگین کن.');
        }

        throw error;
    } finally {
        await browser.close();
    }
}

async function fetchPostComments(postUrl, customSessionPath) {
    const normalizedUrl = validateInstagramUrl(postUrl, 'post');
    const sessionPath = resolveSessionPath(customSessionPath);

    return withBrowser(sessionPath, async (page) => {
        await page.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 0 });
        await ensureLoggedIn(page);
        await checkPrivatePage(page);

        // صبر کنیم صفحه کامل لود بشه
        await page.waitForTimeout(3000);

        // صبر 6 ثانیه برای لود کامنت‌ها
        console.log('Waiting 6 seconds for comments to load...');
        await page.waitForTimeout(6000);

        // حالا همه کامنت‌ها رو جمع کن
        const comments = await page.evaluate(() => {
            const results = [];
            
            // تعداد کامنت‌ها رو نمیدونیم، پس از 1 تا 100 امتحان میکنیم
            for (let i = 1; i <= 100; i++) {
                try {
                    // یوزرنیم - فقط عدد i عوض میشه
                    const usernameXpath = `/html/body/div[1]/div/div/div[2]/div/div/div[1]/div[1]/div[1]/section/main/div/div[1]/div/div[2]/div/div[2]/div/div[2]/div[${i}]/div/div/div[2]/div[1]/div[1]/div/div[1]/span[1]/span/span/div/a/div/div/span`;
                    
                    const usernameEl = document.evaluate(
                        usernameXpath,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;
                    
                    // کامنت - فقط عدد i عوض میشه
                    const commentXpath = `/html/body/div[1]/div/div/div[2]/div/div/div[1]/div[1]/div[1]/section/main/div/div[1]/div/div[2]/div/div[2]/div/div[2]/div[${i}]/div/div/div[2]/div[1]/div[1]/div/div[2]/span`;
                    
                    const commentEl = document.evaluate(
                        commentXpath,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;
                    
                    // اگه هیچ کدوم پیدا نشد، یعنی کامنت‌ها تموم شدن
                    if (!usernameEl && !commentEl) {
                        break;
                    }
                    
                    // اگه پیدا شدن، اضافه کن
                    if (usernameEl && commentEl) {
                        const username = usernameEl.textContent?.trim();
                        const comment = commentEl.textContent?.trim();
                        
                        if (username && comment) {
                            results.push({
                                username: username,
                                comment: comment
                            });
                        }
                    }
                    
                } catch (error) {
                    // اگه خطا داد، احتمالاً به انتهای کامنت‌ها رسیدیم
                    console.warn(`Stopped at index ${i}`);
                    break;
                }
            }
            
            console.log(`Found ${results.length} comments`);
            return results;
        });

        // حذف تکراری‌ها
        const uniqueComments = [];
        const seen = new Set();

        comments.forEach((item) => {
            const key = `${item.username}:${item.comment}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueComments.push(item);
            }
        });

        console.log(uniqueComments);
        console.log(`Returning ${uniqueComments.length} unique comments`);
        return uniqueComments;
    });
}


/**
 * اسکرول فالوئر / فالوینگ با اسکرول واقعی روی دیالوگ
 * (این قسمت مثل قبل مونده)
 */
async function collectConnections(page, listType) {
    const selector = listType === 'followers'
        ? 'a[href$="/followers/"]'
        : 'a[href$="/following/"]';

    const trigger = await page.waitForSelector(selector, { timeout: 10000 });
    await trigger.click();

    await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // موس رو ببریم وسط که اسکرول روی دیالوگ اعمال بشه
    await page.mouse.move(400, 300);

    let lastCount = 0;
    let stableRounds = 0;

    // اسکرول و لود
    for (let i = 0; i < 220; i++) {
        await page.mouse.wheel(0, 1400);
        await page.waitForTimeout(450);

        const count = await page.$$eval(
            'div[role="dialog"] a[href^="/"]',
            (anchors) =>
                anchors.filter((a) => {
                    const username = a.textContent?.trim();
                    const href = a.getAttribute('href') || '';
                    if (!username || !href) return false;
                    if (href === '/' || href.startsWith('/p/')) return false; // پست یا هوم نباشه
                    return true;
                }).length
        );

        if (count === lastCount) {
            stableRounds += 1;
        } else {
            stableRounds = 0;
            lastCount = count;
        }

        if (stableRounds >= 25) {
            break; // چندبار پشت سر هم تعداد ثابت موند → ته لیست
        }
    }

    // حالا لیست کامل رو از داخل دیالوگ بخون
    const entries = await page.evaluate(() => {
        const dialog = document.querySelector('div[role="dialog"]');
        if (!dialog) return [];

        const unique = new Map();
        const anchors = Array.from(dialog.querySelectorAll('a[href^="/"]'));

        anchors.forEach((a) => {
            const username = a.textContent?.trim();
            const href = a.getAttribute('href') || '';
            if (!username || !href) return;
            if (href === '/' || href.startsWith('/p/')) return;

            const url = href.startsWith('http')
                ? href
                : `https://www.instagram.com${href}`;
            unique.set(username, { username, url });
        });

        return Array.from(unique.values());
    });

    try {
        await page.keyboard.press('Escape');
    } catch (error) {
        console.warn('Could not close dialog', error.message);
    }

    await page.waitForTimeout(300);
    return entries;
}

async function fetchProfileConnections(profileUrl, customSessionPath) {
    const normalizedUrl = validateInstagramUrl(profileUrl, 'profile');
    const sessionPath = resolveSessionPath(customSessionPath);

    return withBrowser(sessionPath, async (page) => {
        await page.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 0 });
        await ensureLoggedIn(page);
        await checkPrivatePage(page);

        await page.waitForSelector('header', { timeout: 15000 });
        await page.waitForTimeout(1000);

        const followers = await collectConnections(page, 'followers');
        const following = await collectConnections(page, 'following');

        return { followers, following };
    });
}

module.exports = {
    fetchPostComments,
    fetchProfileConnections,
    HttpError
};
