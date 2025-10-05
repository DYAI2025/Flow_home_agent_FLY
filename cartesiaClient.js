const DEFAULT_API_URL = 'https://api.cartesia.ai/v1';
const DEFAULT_FACE_RENDER_PATH = '/faces/{faceId}/render';
const fetchApi = globalThis.fetch;

class CartesiaConfigurationError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'CartesiaConfigurationError';
    this.statusCode = statusCode;
  }
}

function sanitizeBaseUrl(url) {
  if (!url) return DEFAULT_API_URL;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function resolveFaceRenderPath(faceId) {
  const template = process.env.CARTESIA_FACE_RENDER_PATH || DEFAULT_FACE_RENDER_PATH;
  return template.replace('{faceId}', encodeURIComponent(faceId));
}

function resolveAvatarUrl(faceId) {
  const explicitUrl = process.env.CARTESIA_FACE_RENDER_URL;
  if (explicitUrl) {
    return explicitUrl.replace('{faceId}', encodeURIComponent(faceId));
  }

  const baseUrl = sanitizeBaseUrl(process.env.CARTESIA_API_URL);
  const path = resolveFaceRenderPath(faceId);
  if (!path.startsWith('/')) {
    return `${baseUrl}/${path}`;
  }
  return `${baseUrl}${path}`;
}

function getPublicConfig() {
  const voiceId = process.env.CARTESIA_VOICE_ID || null;
  const faceId = process.env.CARTESIA_FACE_ID || null;
  return {
    provider: 'cartesia',
    voiceId,
    faceId,
    voiceConfigured: Boolean(voiceId),
    faceConfigured: Boolean(faceId && process.env.CARTESIA_API_KEY),
  };
}

async function fetchAvatarImage() {
  const apiKey = process.env.CARTESIA_API_KEY;
  const faceId = process.env.CARTESIA_FACE_ID;

  if (!faceId) {
    throw new CartesiaConfigurationError('CARTESIA_FACE_ID is not configured', 503);
  }

  if (!apiKey) {
    throw new CartesiaConfigurationError('CARTESIA_API_KEY is not configured', 503);
  }

  const avatarUrl = resolveAvatarUrl(faceId);

  if (typeof fetchApi !== 'function') {
    throw new CartesiaConfigurationError('Fetch API is not available in this runtime', 500);
  }

  const response = await fetchApi(avatarUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'image/*',
    },
  });

  if (response.status === 404) {
    throw new CartesiaConfigurationError('Cartesia avatar asset not found', 404);
  }

  if (!response.ok) {
    const payload = await response.text().catch(() => '');
    throw new Error(`Cartesia avatar request failed with status ${response.status}: ${payload}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/png';

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}

module.exports = {
  CartesiaConfigurationError,
  fetchAvatarImage,
  getPublicConfig,
};
