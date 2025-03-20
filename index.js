const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000; 

app.use(bodyParser.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Client is ready!');
});

client.on('message', message => {
    console.log(`📩 Message from ${message.from}: ${message.body}`);

    if (message.body.toLowerCase() === '!ping') {
        message.reply('pong 🏓');
    }

    if (message.body.toLowerCase() === '!hello') {
        message.reply('Hello! 👋 How can I help you?');
    }
});

client.initialize();


app.post('/send-message', async (req, res) => {
    const number = req.body.number;
    const message = req.body.message;

    if (!number || !message) {
        return res.status(400).json({
            status: false,
            message: 'Missing number or message in body'
        });
    }

    // Format the number to include the WhatsApp domain
    const chatId = `${number}@c.us`;

    try {
        const sentMessage = await client.sendMessage(chatId, message);

        return res.status(200).json({
            status: true,
            message: 'Message sent',
            data: sentMessage
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({
            status: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 Express server running on http://localhost:${port}`);
});