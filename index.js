const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = 3000;

// Middlewares
app.use(bodyParser.json());

require('dotenv').config();
const TOKEN = process.env.API_TOKEN;

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ status: false, message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (token !== TOKEN) return res.status(403).json({ status: false, message: 'Invalid token' });

    next();
};

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox'] }
});

client.on('qr', qr => {
    console.log('Scan QR Code Below:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
});

client.initialize();

app.post('/send-message', verifyToken, async (req, res) => {
    let number = req.body.number;
    const message = req.body.message;

    if (!number || !message) {
        return res.status(400).json({ status: false, message: 'Missing number or message' });
    }

    if (number.startsWith('0')) {
        number = '62' + number.slice(1);
    }

    const chatId = `${number}@c.us`;

    try {
        const sent = await client.sendMessage(chatId, message);
        res.status(200).json({ status: true, message: 'Message sent!', data: sent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Failed to send message', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 API Server listening at http://localhost:${port}`);
});
