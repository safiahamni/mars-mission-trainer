import { defineConfig } from 'vite';

export default defineConfig({
  // './' makes every file path relative, so the built game works at
  // https://<user>.github.io/<repo-name>/ even if the repo is renamed later.
  base: './',
});