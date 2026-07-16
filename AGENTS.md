# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single, self-contained static web app: `index.html` (an "Email Signature Builder"). There is no package manager, build step, lint config, or test suite — everything (HTML/CSS/JS) lives inline in `index.html`.

- Run (dev): serve the folder statically, e.g. `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000/index.html`. Opening the file directly also works, but a server is preferred so clipboard/`ClipboardItem` APIs behave normally.
- Build: none. Do not look for a bundler or `npm run build`.
- Lint/Test: none configured. Verify changes by loading the page and checking the live preview updates as form fields change.
- Division logos and social icons load from an external host (`https://www.gamechangers.vc/assets/logos/`). If egress is blocked they render as broken images; this does not affect the app's core JS/preview logic.
