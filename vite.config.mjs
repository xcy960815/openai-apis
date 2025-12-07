import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'example/client',
  envDir: '../../',
  envPrefix: 'OPENAI_',
  server: {
    fs: {
      allow: ['../..']
    }
  }
});
