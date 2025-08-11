#!/bin/sh
# FocusFlow deployment and cleanup script
# Usage: sh deploy-cleanup.sh

# Stop and remove old container
if docker ps -a | grep -q focus-flow; then
  echo "Stopping and removing old container..."
  docker stop focus-flow || true
  docker rm focus-flow || true
fi

# Remove old image
if docker images | grep -q focus-flow; then
  echo "Removing old image..."
  docker rmi focus-flow || true
fi

# Prune unused Docker data
echo "Pruning unused Docker data..."
docker system prune -f

# Build new image
echo "Building new Docker image..."
docker build -t focus-flow .

# Run new container
echo "Running new container..."
docker run -d \
  --name focus-flow \
  -v /opt/focus/data:/app/data \
  -p 4000:4000 \
  -e DATABASE_URL="file:/app/data/dev.db" \
  focus-flow

# Run Prisma migrations inside the container
echo "Running Prisma migrations..."
docker exec -it focus-flow npx prisma migrate deploy

# (Optional) Seed the database
# docker exec -it focus-flow npx prisma db seed

echo "Deployment complete! Access your app at http://<homeserver-ip>:4000"
