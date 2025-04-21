const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const TOKEN = process.env.API_TOKEN;

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// WhatsApp Client Configuration
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './session-data'  // Custom session storage path
  }),
  puppeteer: {
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process'
    ]
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
  }
});

// State Management
let qrCode = null;
let isReady = false;

// Event Handlers
client.on('qr', qr => {
  qrCode = qr;
  console.log('QR Received - Scan with your phone');
  qrcode.toString(qr, { type: 'terminal', small: true }, (err, url) => {
    if (err) throw err;
    console.log(url);
  });
});

client.on('ready', () => {
  isReady = true;
  console.log('✅ Client is ready');
});

client.on('disconnected', (reason) => {
  isReady = false;
  console.log('❌ Client disconnected:', reason);
  setTimeout(() => client.initialize(), 5000);  // Auto-reconnect
});

client.initialize();

// Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== TOKEN) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  next();
};

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    whatsapp: isReady ? 'connected' : 'disconnected'
  });
});

app.get('/qr', authenticate, async (req, res) => {
  if (!qrCode) {
    return res.status(404).json({ error: 'QR not available' });
  }
  
  try {
    const qrImage = await qrcode.toDataURL(qrCode);
    res.send(`
      <html>
        <head>
          <title>WhatsApp QR</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            img { max-width: 300px; margin: 20px auto; display: block; }
          </style>
        </head>
        <body>
          <h2>Scan WhatsApp QR Code</h2>
          <img src="${qrImage}" />
          <p>Scan this code with your phone</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

app.post('/send-message', authenticate, async (req, res) => {
  const { number, message } = req.body;
  
  if (!number || !message) {
    return res.status(400).json({ error: 'Number and message required' });
  }

  try {
    const formattedNumber = number.startsWith('0') ? '62' + number.slice(1) : number;
    const chatId = `${formattedNumber}@c.us`;
    
    if (!isReady) {
      return res.status(503).json({ error: 'WhatsApp client not ready' });
    }

    const sentMessage = await client.sendMessage(chatId, message);
    res.json({
      success: true,
      messageId: sentMessage.id.id,
      timestamp: sentMessage.timestamp
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  client.destroy().then(() => process.exit(0));
});

