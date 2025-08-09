# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment Variables

For local development:
1. Copy `.env.example` to `.env`
2. Fill in any required values (see comments in `.env.example`)
3. Do NOT commit secrets to GitHub!

For production (Docker, Vercel, etc):
- Set environment variables in your deployment platform (do not rely on `.env`)
- For Docker, you can use `docker run -e VAR=value ...` or `docker-compose.yml` with an `environment:` section
- For Vercel, set variables in the dashboard

### NextAuth Secret (if enabled)
If you use NextAuth, set a strong `NEXTAUTH_SECRET` in your environment (never commit it to the repo).

---
