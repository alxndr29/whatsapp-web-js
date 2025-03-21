const express = require('express');
const bodyParser = require('body-parser');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const puppeteer = require('puppeteer');

const { Client, LocalAuth } = require('whatsapp-web.js');

require('dotenv').config();
const app = express();

const port = process.env.PORT;
const TOKEN = process.env.API_TOKEN;


app.use(bodyParser.json());


const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({
            status: false,
            message: 'No token provided'
        });
    }

    const token = authHeader.split(' ')[1];
    if (token !== TOKEN) {
        return res.status(403).json({
            status: false,
            message: 'Invalid token'
        });
    }

    next();
};

// WhatsApp client setup
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        // Use the puppeteer you installed
        executablePath: puppeteer.executablePath(),
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
});

let latestQR = '';
let isClientReady = false; 

client.on('qr', qr => {
    latestQR = qr;
    console.log('📲 QR received! Open /qr to view.');
});

client.on('ready', () => {
    isClientReady = true;
    console.log('✅ WhatsApp client is ready!');
});

client.on('disconnected', (reason) => {
    isClientReady = false;
    console.log('❌ WhatsApp client disconnected:', reason);
});

client.on('auth_failure', (msg) => {
    isClientReady = false;
    console.error('❌ Authentication failure:', msg);
});

client.initialize();

// Routes

app.get('/', async (req, res) => {
    res.status(200).json({
        status: true,
        message: 'Hello World!',
        data: []
    });
});

app.get('/qr', verifyToken, async (req, res) => {
    if (!latestQR) {
        return res.send('No QR code available. Client might already be connected.');
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

// NEW: WhatsApp Web client connection status
app.get('/status', verifyToken, async (req, res) => {
    try {
        let clientInfo = {};
        if (isClientReady) {
            clientInfo = client.info; 
        }

        res.status(200).json({
            status: true,
            message: 'Client status fetched successfully',
            data: {
                ready: isClientReady,
                clientInfo: isClientReady ? clientInfo : null
            }
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error fetching status',
            error: error.message
        });
    }
});


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
        console.log(number +" => "+ message);
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

app.listen(port, () => {
    console.log(`🚀 API Server listening at http://localhost:${port}`);
});
