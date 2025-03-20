## 🙏 Thanks

Special thanks to [pedroslopez](https://github.com/pedroslopez) for the [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) library!

## Credits

This project is powered by [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js), developed and maintained by [pedroslopez](https://github.com/pedroslopez).  
Thank you for your contributions to the open-source community!


# Node.js Application

A simple Node.js application using **Node.js v18**.

## Requirements

- Node.js v18.x
- npm (comes with Node.js)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file in the root of the project:

```bash
touch .env
```

Add the following environment variables inside the `.env` file:

```
API_TOKEN=your_api_token_here
PORT=3000
```

> Replace `your_api_token_here` with your actual API token.

### 4. Run the application

```bash
npm start
```

Or, if you are using `nodemon` for development:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port you specified).

## Scripts

- `npm start` — Start the server.
- `npm run dev` — Start the server in development mode (requires `nodemon`).

## Project Structure

```
├── src/
├── .env
├── package.json
└── README.md
```

## Environment Variables

| Name       | Description          | Example        |
|------------|----------------------|----------------|
| API_TOKEN  | Your API token       | abc123xyz      |
| PORT       | Port to run the app  | 3000           |
