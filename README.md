# 2FA Live

Open-source browser extension for showing a TOTP 2FA code instantly from a shared secret.

## Features

- Generates 6-digit TOTP codes locally in the popup.
- Updates automatically when the current code expires.
- Shows the countdown to the next code.
- Copies the current code with one click.
- Does not send secrets anywhere.

## Development

```bash
npm install
npm run dev
```

For Chrome/Chromium development, open `chrome://extensions`, enable Developer mode, and load the generated extension from the Vite/CRXJS development output.

Build a production extension:

```bash
npm run build
```

The packaged extension files are emitted to `dist`.

## Author

Trang Ha Viet

## Secret Format

Paste the Base32 secret provided by your service, usually from an authenticator setup screen. Spaces are ignored.
