// server.js - Node.js server to serve the avatar cockpit
const express = require('express');
const http = require('http');
const path = require('path');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
const server = http.createServer(app);

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
      url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
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
});

module.exports = server;