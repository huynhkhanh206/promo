import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// GitHub Pages project sites are hosted under /<repository>/.
// Read the repository name from GitHub Actions so the same code also works
// locally in StackBlitz (base '/') and for username.github.io sites (base '/').
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isUserOrOrgSite = Boolean(repositoryName?.endsWith('.github.io'));
const base = process.env.GITHUB_ACTIONS === 'true' && repositoryName && !isUserOrOrgSite
  ? `/${repositoryName}/`
  : '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
