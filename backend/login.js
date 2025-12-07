const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { chromium } = require('playwright');

const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

(async () => {
    const browser = await chromium.launch({
        headless: false
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    console.log("Opening Instagram...");
    await page.goto('https://www.instagram.com', {
        waitUntil: 'domcontentloaded', // ✅ دیگه networkidle نیست
        timeout: 0                      // ✅ یعنی بدون محدودیت زمانی
    });

    console.log("✅ وارد اکانت شو.");
    console.log("⏳ وقتی لاگین کردی، برگرد ترمینال و Enter بزن.");

    rl.question("", async () => {
        const sessionPath = path.join(sessionsDir, `session-${Date.now()}.json`);
        await context.storageState({ path: sessionPath });

        console.log(`✅ سشن ذخیره شد: ${sessionPath}`);

        await browser.close();
        rl.close();
    });
})();
