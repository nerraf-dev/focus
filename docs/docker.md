Got it, port **4000** it is. Here’s the updated version with port 4000 for `focus-flow`:

---

## **Deploying & Rebuilding `focus-flow` on Homeserver (port 4000)**

---

### 1. Stop and Remove Old Containers

```bash
docker ps -a | grep focus-flow
docker rm -f $(docker ps -a -q --filter ancestor=focus-flow)
```

---

### 2. Remove Old Image

```bash
docker rmi -f focus-flow
```

---

### 3. Prepare Persistent Data Directory

```bash
mkdir -p /opt/focus/data
chmod 777 /opt/focus/data
```

---

### 4. Pull Latest Code

```bash
cd /opt/focus
git pull
```

---

### 5. Build New Image

```bash
docker build -t focus-flow .
```

---

### 6. Run Prisma Migrations (One-Time / On Schema Changes)

```bash
docker run --rm \
  -v /opt/focus/data:/app/data \
  -e DATABASE_URL="file:/app/data/dev.db" \
  focus-flow npx prisma migrate dev
```

---

### 7. Start Container

```bash
docker run -d \
  --name focus-flow \
  -v /opt/focus/data:/app/data \
  -p 4000:4000 \
  -e DATABASE_URL="file:/app/data/dev.db" \
  focus-flow
```

---

### 8. Check Logs

```bash
docker logs -f focus-flow
```

---

### 9. Optional Cleanup of Unused Images & Containers

```bash
docker system prune -af
```

---

### Quick Rebuild Sequence (For future updates)

```bash
docker rm -f focus-flow
docker rmi -f focus-flow
git pull
docker build -t focus-flow .
docker run -d \
  --name focus-flow \
  -v /opt/focus/data:/app/data \
  -p 4000:4000 \
  -e DATABASE_URL="file:/app/data/dev.db" \
  focus-flow
```

---
