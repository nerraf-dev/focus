# Use Node 20 for stability
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps \
    && npm install @genkit-ai/firebase @opentelemetry/exporter-jaeger --save

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# --- Runtime image ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy built app from builder stage
COPY --from=builder /app ./

# Expose port 4000
EXPOSE 4000

# Start Next.js app
CMD ["npm", "start", "--", "-p", "4000"]