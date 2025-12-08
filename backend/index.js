const express = require('express');
const path = require('path');
const routes = require('./routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {return res.sendStatus(204);}
    next();
});

app.use('/api', routes);

app.get('/', (_req, res) => {res.json({ status: 'ok', message: 'instagram helper backend is running.' });});

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {console.log(`ready on port : ${PORT}`);});
