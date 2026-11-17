import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rolldownOptions: {
      input: ['index', 'experience', 'projects', 'lab', 'about', 'future', 'philosophy']
        .map((page) => resolve(import.meta.dirname, `${page}.html`)),
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['terminal.local'],
  },
});
