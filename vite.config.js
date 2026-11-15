import { defineConfig } from 'vite';

export default defineConfig({
  // Keep deployed URLs relative for GitHub Pages.
  base: './',
  build: {
    rolldownOptions: {
      input: ['index.html', 'src/places/science-lab/index.html'],
    },
  },
});
