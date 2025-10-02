# Deployment Guide

This document outlines how to deploy the LiveKit Avatar Cockpit frontend to Fly.io. The application is a single Node.js service that serves static assets and exposes a `/token` endpoint for LiveKit authentication.

## Prerequisites

- A Fly.io account and the `flyctl` CLI installed.
- LiveKit credentials (URL, API key and API secret).
- Docker installed locally if you wish to build/run the container before deploying.

## Fly.io Deployment

1. **Authenticate with Fly.io**

   ```bash
   fly auth login
   ```

2. **Create or configure the application**

   The repository already contains a `fly.toml` describing the service. Run the following command to create the application on Fly (skip if it already exists):

   ```bash
   fly launch --no-deploy
   ```

   If `flyctl` asks about creating a new app, choose a unique name or edit `fly.toml` before running the command.

3. **Set secrets**

   ```bash
   fly secrets set \
     LIVEKIT_URL=wss://your-livekit-host \
     LIVEKIT_API_KEY=lk_api_key \
     LIVEKIT_API_SECRET=lk_api_secret
   ```

4. **Deploy**

   ```bash
   fly deploy
   ```

   The provided Dockerfile only builds the Node.js frontend, avoiding previous references to missing directories that caused `flyctl launch sessions finalize` to fail.

5. **Verify**

   ```bash
   fly status
   fly logs
   ```

   You can also hit `https://<app-name>.fly.dev/healthz` to check the health endpoint.

## Troubleshooting

- **`Error: Not Found` during `fly launch`** – earlier versions of the project referenced directories that were not part of the repository. The simplified Dockerfile in the current version avoids these missing paths so the build can succeed.
- **Token endpoint returning errors** – ensure all three LiveKit environment variables are set through Fly secrets or the container environment.
- **Static assets not loading** – the server serves `index.html` from the project root. Ensure that the deployment bundle includes this file (it does by default when using `fly deploy`).

## Render Deployment

Render can run the same Docker image. Create a new Web Service in the Render dashboard and point it to this repository. Use `npm start` as the start command and configure the same LiveKit environment variables.
