import { crx } from '@crxjs/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

function createManifest(browserTarget: 'chrome' | 'firefox') {
  return {
    manifest_version: 3,
    name: '2FA Live',
    version: '0.1.0',
    description: 'Show live TOTP 2FA codes instantly from a user-provided secret.',
    icons: {
      '128': 'icons/avatar.png',
    },
    action: {
      default_popup: 'index.html',
      default_title: '2FA Live',
    },
    ...(browserTarget === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              data_collection_permissions: {
                required: ['none'],
              },
              id: '2fa-live@local',
              strict_min_version: '140.0',
            },
            gecko_android: {
              strict_min_version: '142.0',
            },
          },
        }
      : {}),
  };
}

export default defineConfig(({ mode }) => {
  const browserTarget = mode === 'firefox' ? 'firefox' : 'chrome';
  const manifest = createManifest(browserTarget);

  return {
    plugins: [svelte(), crx({ manifest })],
  };
});
