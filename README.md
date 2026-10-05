# A Bouquet of Things

A warm, mobile-first digital gift where every illustrated flower holds a memory, song, photo, compliment, plan, secret, or tiny note.

## Run locally

Node.js 24 is installed locally at `~/.local/node-v24.21.0` for this project setup.

```sh
~/.local/node-v24.21.0/bin/node server.mjs
```

Open `http://localhost:4173`.

No package installation or external dependency is required. The project uses browser-native JavaScript modules and a small Node.js server.

## What works

- Ten original, reusable vector flower illustrations
- Guided bouquet creation with text, songs, links, and photo uploads
- Persistent bouquet records with unique `/bouquet/{id}` recipient URLs
- Keyboard and touch-friendly flower discovery
- WhatsApp, email composer, and copy-link sharing
- A4 vector print composition with attached notes
- Draft recovery in local storage and server records in `data/bouquets.json`
- Responsive layouts and reduced-motion support

## Storage and deployment

`src/storage.js` is the client storage boundary. The included server persists bouquets to `data/bouquets.json`, which is useful for a local prototype or a single server instance.

For public sharing, deploy the project at a public origin and replace the file-backed API with durable database storage. The generated URLs and WhatsApp/email actions automatically use the deployed origin. The email action currently opens the sender's email app with the postcard copy and unique link; a production email provider can be added behind the same share flow.

## Checks

```sh
PATH="$HOME/.local/node-v24.21.0/bin:$PATH" npm run check
```