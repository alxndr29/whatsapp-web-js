const express = require('express');
const bodyParser = require('body-parser');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');

const {
    Client,
    LocalAuth
} = require('whatsapp-web.js');

require('dotenv').config();
const app = express();

const port = process.env.PORT;
// Middlewares
app.use(bodyParser.json());

const TOKEN = process.env.API_TOKEN;

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({
        status: false,
        message: 'No token provided'
    });

    const token = authHeader.split(' ')[1];
    if (token !== TOKEN) return res.status(403).json({
        status: false,
        message: 'Invalid token'
    });

    next();
};

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});
let latestQR = '';
client.on('qr', qr => {
    latestQR = qr;
    console.log('QR received! Open /qr to view.');
});

client.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
});

client.initialize();

app.post('/send-message', verifyToken, async (req, res) => {
    let number = req.body.number;
    const message = req.body.message;

    if (!number || !message) {
        return res.status(400).json({
            status: false,
            message: 'Missing number or message'
        });
    }

    if (number.startsWith('0')) {
        number = '62' + number.slice(1);
    }

    const chatId = `${number}@c.us`;

    try {
        const sent = await client.sendMessage(chatId, message);
        res.status(200).json({
            status: true,
            message: 'Message sent!',
            data: sent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
});
app.get('/', async (req, res) => {
    res.status(200).json({
        status: true,
        message: 'Hello World!',
        data: []
    });
});
app.get('/qr', async (req, res) => {
    if (!latestQR) {
        return res.send('No QR code available.');
    }
    try {
        const qrImage = await qrcode.toDataURL(latestQR);
        res.send(`
            <html>
                <body>
                    <h2>Scan QR Code</h2>
                    <img src="${qrImage}" />
                </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send('Error generating QR code.');
    }
});
app.listen(port, () => {
    console.log(`🚀 API Server listening at http://localhost:${port}`);
});