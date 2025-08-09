# Focus-Flow

This is a NextJS starter

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

## 🗄️ SQLite Persistence with Docker

By default, the SQLite database (`prisma/dev.db`) is stored inside the container. If you want your data to persist even if you rebuild or remove the container, you can mount a volume:

**Example:**
```sh
docker run -p 4000:4000 --env-file .env \
  -v /path/on/host/dev.db:/app/prisma/dev.db \
  focusflow
```
- `/path/on/host/dev.db` is a folder on your Proxmox host
- `/app/prisma/dev.db` is where the app expects the database

**Why use a volume?**
- Keeps your data safe if you update or rebuild the container
- Makes backups and migrations easier

If you’re just testing or don’t care about long-term data, you can skip the volume and run as-is!

---

## 🐘 Migrating to Postgres (or MySQL)

If you want to use Postgres for production:
1. Run a Postgres container (or use a cloud DB)
2. Update your `.env` file:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   ```
3. Update your `prisma/schema.prisma` to use `provider = "postgresql"`
4. Run `npx prisma migrate deploy` in your Dockerfile or entrypoint
5. Rebuild and restart your app

**Tip:** You can use Docker Compose to run both your app and Postgres together.
