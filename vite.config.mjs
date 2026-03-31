import { defineConfig } from 'vite';
import { Readable } from 'node:stream';
import path from 'path';

const OPENAI_DEV_PROXY_PREFIX = '/api/openai';
const OPENAI_DEV_PROXY_PREFIX_WITH_SLASH = `${OPENAI_DEV_PROXY_PREFIX}/`;

function createProxyRequestHeaders(headers) {
  const nextHeaders = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (
      value == null ||
      key === 'host' ||
      key === 'content-length' ||
      key === 'accept-encoding' ||
      key === 'origin' ||
      key === 'referer'
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => nextHeaders.append(key, item));
    } else {
      nextHeaders.set(key, value);
    }
  }

  return nextHeaders;
}

function applyProxyResponseHeaders(proxyResponse, response) {
  proxyResponse.headers.forEach((value, key) => {
    if (
      key === 'connection' ||
      key === 'content-encoding' ||
      key === 'content-length' ||
      key === 'transfer-encoding'
    ) {
      return;
    }

    response.setHeader(key, value);
  });
}

function parseProxyTarget(requestUrl = '') {
  const incomingUrl = new URL(requestUrl, 'http://localhost');
  if (!incomingUrl.pathname.startsWith(OPENAI_DEV_PROXY_PREFIX_WITH_SLASH)) {
    return null;
  }

  const proxyPath = incomingUrl.pathname.slice(OPENAI_DEV_PROXY_PREFIX_WITH_SLASH.length);
  const separatorIndex = proxyPath.indexOf('/');
  if (separatorIndex === -1) {
    return { incomingUrl, upstreamBaseUrl: null, upstreamPath: null };
  }

  const upstreamBaseUrl = decodeURIComponent(proxyPath.slice(0, separatorIndex));
  const upstreamPath = proxyPath.slice(separatorIndex);

  if (!/^https?:\/\//.test(upstreamBaseUrl) || !upstreamPath) {
    return { incomingUrl, upstreamBaseUrl: null, upstreamPath: null };
  }

  return { incomingUrl, upstreamBaseUrl, upstreamPath };
}

async function proxyOpenAIRequest(request, response, next) {
  const proxyTarget = parseProxyTarget(request.url);
  if (!proxyTarget) {
    next();
    return;
  }

  if (!proxyTarget.upstreamBaseUrl || !proxyTarget.upstreamPath) {
    response.statusCode = 400;
    response.end('Invalid OpenAI proxy target.');
    return;
  }

  const { incomingUrl, upstreamBaseUrl, upstreamPath } = proxyTarget;
  const upstreamUrl = `${upstreamBaseUrl}${upstreamPath}${incomingUrl.search}`;
  const requestInit = {
    method: request.method,
    headers: createProxyRequestHeaders(request.headers),
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    requestInit.body = request;
    requestInit.duplex = 'half';
  }

  try {
    const proxyResponse = await fetch(upstreamUrl, requestInit);

    response.statusCode = proxyResponse.status;
    response.statusMessage = proxyResponse.statusText;
    applyProxyResponseHeaders(proxyResponse, response);

    if (!proxyResponse.body) {
      response.end();
      return;
    }

    Readable.fromWeb(proxyResponse.body).pipe(response);
  } catch (error) {
    next(error);
  }
}

export default defineConfig({
  root: 'example/client',
  envDir: '../../',
  envPrefix: 'OPENAI_',
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  plugins: [
    {
      name: 'openai-dev-proxy',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          void proxyOpenAIRequest(request, response, next);
        });
      },
    },
  ],
  server: {
    fs: {
      allow: ['../..']
    }
  }
});
