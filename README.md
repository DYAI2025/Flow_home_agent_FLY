# Voice AI Agent Frontend

This repository contains a lightweight Node.js/Express application that serves an Avatar Cockpit for interacting with a LiveKit-based voice agent. The frontend can request LiveKit access tokens from the backend, connect to a room, exchange data messages, and preview Ready Player Me avatars.

## Features

- Single-page cockpit UI built with vanilla HTML/CSS/JavaScript.
- LiveKit token endpoint that signs JWTs with the credentials supplied through environment variables.
- Real-time status updates and chat view for data messages.
- Optional Ready Player Me avatar preview support.

## Requirements

- Node.js 18+ (locally) or Docker to build and run the service.
- LiveKit credentials (URL, API key, API secret) for the `/token` endpoint.

## Getting Started Locally

```bash
npm install
npm start
```

By default the server listens on port `3000`. Open `http://localhost:3000` in a browser to access the cockpit UI.

Set the following environment variables before starting the server so the `/token` endpoint can mint credentials for your LiveKit deployment:

```bash
export LIVEKIT_URL="wss://your-livekit-host"
export LIVEKIT_API_KEY="lk_api_key"
export LIVEKIT_API_SECRET="lk_api_secret"
```

If these variables are not present the `/token` endpoint will respond with an error instead of failing silently.

## Docker Usage

A minimal Dockerfile is provided. Build and run the container with:

```bash
docker build -t voice-ai-agent .
docker run -p 3000:3000 \
  -e LIVEKIT_URL=wss://your-livekit-host \
  -e LIVEKIT_API_KEY=lk_api_key \
  -e LIVEKIT_API_SECRET=lk_api_secret \
  voice-ai-agent
```

## Repository Structure

```
├── Dockerfile             # Docker image for the frontend
├── README.md              # Project documentation
├── DEPLOYMENT.md          # Deployment notes for cloud targets
├── index.html             # Single page application
├── package.json           # Node.js metadata
├── server.js              # Express server with LiveKit token endpoint
└── server/                # Optional local LiveKit helper scripts
```

The Python scripts shipped in the repository are reference utilities from the original project and are not required to run the frontend.

## Development Notes

- `npm run dev` (with nodemon) can be used for live reloading during development.
- A `/healthz` route is available for simple health checks.
- Static assets (including `index.html`) are served directly from the project root via Express.
