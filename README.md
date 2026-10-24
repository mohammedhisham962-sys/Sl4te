# Slate: a chatbot that forgets

Static page (`public/index.html`) + one stateless serverless function (`api/chat.js`).
No database, no accounts, no logging of conversations.

## Run locally
1. Install Node 18+ and run `npm i -g vercel`
2. Copy `.env.example` to `.env` and put your Anthropic API key in it
3. Run `vercel dev` and open http://localhost:3000

## Deploy to Vercel
1. Run `vercel` in this folder (or import the folder from a Git repo at vercel.com)
2. In Project Settings > Environment Variables add `ANTHROPIC_API_KEY`
3. Redeploy. Camera and microphone need the HTTPS URL Vercel gives you.

Before sharing the link widely, add rate limiting (Vercel Firewall) because requests use your API key.
