import { crx } from '@crxjs/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const manifest = {
  manifest_version: 3,
  name: '2FA Live',
  version: '0.1.0',
  description: 'Show live TOTP 2FA codes instantly from a user-provided secret.',
  action: {
    default_popup: 'index.html',
    default_title: '2FA Live',
  },
  permissions: ['clipboardWrite'],
};

export default defineConfig({
  plugins: [svelte(), crx({ manifest })],
});

