# FocusFlow Deployment & Cleanup Guide

This guide helps you deploy and clean up your FocusFlow Docker app on a small server.

---

## 1. **Pre-Build Cleanup**
Remove old containers and images to save disk space:

```sh
# Stop and remove old container
docker stop focus-flow || true
docker rm focus-flow || true

# Remove old image
docker rmi focus-flow || true

# Remove dangling images and unused data
docker system prune -f
```

---

## 2. **Build and Run the Container**

```sh
# Build the Docker image
docker build -t focus-flow .

# Run the container
# -v mounts persistent SQLite data
# -p maps port 4000 on host to 4000 in container
# -e sets the database location
docker run -d \
  --name focus-flow \
  -v /opt/focus/data:/app/data \
  -p 4000:4000 \
  -e DATABASE_URL="file:/app/data/dev.db" \
  focus-flow
```

---

## 3. **Run Prisma Migrations (Inside the Container)**

```sh
docker exec -it focus-flow /bin/sh
npx prisma migrate deploy
# Or for dev:
npx prisma migrate dev
```

---

## 3a. **Why Run Prisma Migrations?**

After starting your container, you must run a Prisma migration command to set up or update your database schema. This ensures your database structure matches your app’s expectations.

**Commands:**

```sh
# Apply all migrations (recommended for production)
docker exec -it focus-flow /bin/sh
npx prisma migrate deploy

# For development, apply new changes interactively:
docker exec -it focus-flow /bin/sh
npx prisma migrate dev
```

Run this step every time you change your Prisma schema or after pulling new code with schema changes.

---

## 4. **(Optional) Seed the Database**

```sh
npx prisma db seed
```

---

## 5. **Access the App**

Open your browser at:
```
http://<homeserver-ip>:4000
```

---

## 6. **Post-Run Cleanup (Optional)**
Remove stopped containers, unused images, and cache:

```sh
docker system prune -af
```
*Be careful: this removes all stopped containers and unused images!*

---

**Tip:**
- You can copy these commands into a shell script for easy reuse.
- If you want to keep only the latest image/container, these commands are safe.
