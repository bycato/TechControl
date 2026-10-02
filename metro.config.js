const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// O SQLite usa um worker e um arquivo WebAssembly na versão para navegador.
config.resolver.assetExts.push('wasm');

// Permite SharedArrayBuffer, necessário para a comunicação com o worker do SQLite.
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(request, response, next);
};

module.exports = config;
