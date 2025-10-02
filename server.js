// server.js - Node.js server to serve the avatar cockpit
const express = require('express');
const http = require('http');
const path = require('path');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
const server = http.createServer(app);

function normalizeLivekitUrl(rawUrl) {
  if (!rawUrl) {
    return 'ws://localhost:7880';
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'ws:';
    } else if (parsed.protocol === 'https:') {
      parsed.protocol = 'wss:';
    }
    if (!parsed.protocol.startsWith('ws')) {
      throw new Error(`Unsupported LiveKit protocol: ${parsed.protocol}`);
    }
    return parsed.toString();
  } catch (error) {
    console.warn('Invalid LIVEKIT_URL provided, falling back to ws://localhost:7880', error.message);
    return 'ws://localhost:7880';
  }
}

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Endpoint to generate access tokens for clients
app.get('/token', (req, res) => {
  const API_KEY = process.env.LIVEKIT_API_KEY;
  const API_SECRET = process.env.LIVEKIT_API_SECRET;
  const room = req.query.room || 'default-room';
  const participantIdentity = req.query.identity || `participant-${Date.now()}`;

  if (!API_KEY || !API_SECRET) {
    return res.status(500).send({
      error: 'LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be configured',
    });
  }

  try {
    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: participantIdentity,
    });

    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

    res.json({
      token: at.toJwt(),
      url: normalizeLivekitUrl(process.env.LIVEKIT_URL),
      room,
    });
  } catch (error) {
    console.error('Failed to create LiveKit access token', error);
    res.status(500).send({ error: 'Failed to create access token' });
  }
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Using LiveKit URL: ${normalizeLivekitUrl(process.env.LIVEKIT_URL)}`);
});

module.exports = server;