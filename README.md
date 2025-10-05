# Voice AI Agent Frontend

This repository contains a lightweight Node.js/Express application that serves an Avatar Cockpit for interacting with a LiveKit-based voice agent. The frontend can request LiveKit access tokens from the backend, connect to a room, exchange data messages, and preview Cartesia avatars provisioned via Cartesia AI.

## Features

- Single-page cockpit UI built with vanilla HTML/CSS/JavaScript.
- LiveKit token endpoint that signs JWTs with the credentials supplied through environment variables.
- Real-time status updates and chat view for data messages.
- Integrated Cartesia AI avatar preview fed by environment-provided face and voice identifiers.

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

## Cartesia configuration

The cockpit now relies on Cartesia AI for both avatar visuals and voice synthesis metadata. Configure the following environment variables alongside your LiveKit credentials (for production deployments these can be set as Fly.io secrets):

- `CARTESIA_API_KEY` – API key used by the backend to call the Cartesia API. **Do not expose this in the frontend.**
- `CARTESIA_FACE_ID` – Identifier of the Cartesia face to render in the cockpit preview.
- `CARTESIA_VOICE_ID` – Identifier of the Cartesia voice associated with the agent.
- `CARTESIA_API_URL` *(optional)* – Override for the Cartesia API base URL (defaults to `https://api.cartesia.ai/v1`).
- `CARTESIA_FACE_RENDER_PATH` *(optional)* – Path template used to request the face render (defaults to `/faces/{faceId}/render`).
- `CARTESIA_FACE_RENDER_URL` *(optional)* – Provide a fully qualified URL (supports `{faceId}` placeholder) if you prefer not to compose the endpoint from base URL and path.

The backend exposes two helper endpoints used by the SPA:

- `GET /cartesia/config` returns a sanitized summary of the configured Cartesia IDs so the UI can surface them without leaking the API key.
- `GET /cartesia/avatar` proxies the rendered avatar image from Cartesia to the browser.

Without a configured face ID and API key, the refresh button remains disabled and the cockpit displays a notice that the Cartesia avatar is unavailable.

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
