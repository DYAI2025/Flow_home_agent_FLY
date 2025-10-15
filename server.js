// server.js - Node.js server to serve the avatar cockpit
const express = require('express');
const http = require('http');
const path = require('path');
const { AccessToken } = require('livekit-server-sdk');
const {
  CartesiaConfigurationError,
  fetchAvatarImage,
  getPublicConfig,
} = require('./cartesiaClient');

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

// Resolve the path to the LiveKit client's dist directory containing the UMD bundle
const livekitPackageJsonPath = require.resolve('livekit-client/package.json');
const livekitDistDir = path.join(path.dirname(livekitPackageJsonPath), 'dist');

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));
app.use('/vendor/livekit-client', express.static(livekitDistDir));

function createAccessToken({ apiKey, apiSecret, identity, room, ttlSeconds = 6 * 60 * 60 }) {
  if (!apiKey || !apiSecret) {
    throw new Error('LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be configured');
  }

  if (!identity) {
    throw new Error('Participant identity is required to join a room');
  }

  const grants = {
    video: {
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    },
  };

  const jwtOptions = {
    issuer: apiKey,
    expiresIn: ttlSeconds,
    notBefore: 0,
    subject: identity,
    jwtid: identity,
  };

  return jwt.sign(grants, apiSecret, jwtOptions);
}

app.get('/cartesia/config', (_req, res) => {
  res.json(getPublicConfig());
});

app.get('/cartesia/avatar', async (_req, res) => {
  try {
    const { buffer, contentType } = await fetchAvatarImage();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  } catch (error) {
    if (error instanceof CartesiaConfigurationError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Failed to retrieve Cartesia avatar', error);
    res.status(502).json({ error: 'Failed to retrieve Cartesia avatar' });
  }
});

// Endpoint to generate access tokens for clients
app.get('/token', (req, res) => {
  const API_KEY = process.env.LIVEKIT_API_KEY;
  const API_SECRET = process.env.LIVEKIT_API_SECRET;
  const room = (req.query.room || 'default-room').trim();
  const participantIdentity = (req.query.identity || `participant-${Date.now()}`).trim();

  console.log(`Token request received - Room: ${room}, Identity: ${participantIdentity}`);

  try {
    const token = createAccessToken({
      apiKey: API_KEY,
      apiSecret: API_SECRET,
      identity: participantIdentity,
      room,
    });

    const livekitUrl = normalizeLivekitUrl(process.env.LIVEKIT_URL);
    console.log(`Generated token for room: ${room}, URL: ${livekitUrl}`);

    res.json({
      token,
      url: livekitUrl,
      room,
    });
  } catch (error) {
    console.error('Failed to create LiveKit access token', error);
    res.status(500).send({ error: 'Failed to create access token', details: error.message });
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