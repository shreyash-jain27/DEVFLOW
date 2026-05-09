# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder
# Purpose: install ALL dependencies (including devDeps) and run any prep steps.
# We keep this stage separate so dev packages never pollute the final image.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package manifests first (separate layer → cached unless deps change)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies, needed for build tools)
# ci = clean install; reads package-lock.json exactly → deterministic builds
RUN npm ci

# Copy the rest of the source code into the builder
COPY . .

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — production
# Purpose: lean runtime image containing ONLY what's needed to run the server.
# Uses the same base tag for layer-cache efficiency.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS production

# Security: set NODE_ENV so libraries trim dev-only code paths
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# --- Non-root user -----------------------------------------------------------
# node:18-alpine ships with a built-in "node" user (uid 1000).
# Running as a non-root user limits blast radius if the container is compromised.
# We create the dir first as root, then hand ownership to the node user.
RUN chown node:node /app
USER node

# Copy only production node_modules from the builder stage.
# devDependencies (jest, supertest, mongodb-memory-server) are NOT copied.
COPY --chown=node:node --from=builder /app/node_modules ./node_modules

# Copy application source (everything not excluded by .dockerignore)
COPY --chown=node:node --from=builder /app/src ./src
COPY --chown=node:node --from=builder /app/package.json ./package.json

# Expose the port the Express server listens on (documented, not enforced)
EXPOSE 5000

# Docker HEALTHCHECK — used by docker-compose depends_on condition: service_healthy
# Polls GET /api/health every 30s; allows 5s to respond; 3 failures = unhealthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Start the server using node directly (not npm) to receive OS signals correctly.
# npm wraps the process and swallows SIGTERM, preventing graceful shutdown.
CMD ["node", "src/server.js"]
