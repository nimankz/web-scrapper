const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
// پورت پیش‌فرض را با مقدار API فرانت‌اند هم‌سو می‌کنیم تا تداخلی با سرور توسعهٔ ری‌اکت نداشته باشد
const PORT = process.env.PORT || 8000;

app.use(express.json());
// اجازهٔ اتصال از فرانت‌اند (CORS ساده بدون وابستگی اضافه)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
app.use('/api', routes);

app.get('/', (_req, res) => {
    console.log('✅ روت اصلی صدا زده شد');
    res.json({ status: 'ok', message: 'Instagram helper backend is running.' });
});

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 Server ready on http://localhost:${PORT}`);
    console.log(`Sessions directory: ${path.join(__dirname, 'sessions')}`);
});
