# Skinners Bar Bingo

A mobile-first, peer-to-peer UK 90-ball bingo web app for up to six players.

## Features
- Create a room with a four-digit code
- Join from separate phones, tablets, or computers
- Up to six players
- Unique UK-style 90-ball tickets
- Manual or automatic number calling
- Spoken calls and bingo nicknames
- Virtual tap-to-mark tokens
- Automatic line, two-line, and full-house validation
- No separate host screen: the room creator plays and sees compact controls

## Run locally
Because browsers restrict networking on `file://` pages, serve the folder with a basic local server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy
Upload these files to GitHub Pages, Netlify, Cloudflare Pages, or another static host. HTTPS is recommended.

## Multiplayer notes
The app uses PeerJS and its public signalling service. The room creator's device acts as the game authority, so it must remain connected during the round. No player data is stored on a server by this project.
