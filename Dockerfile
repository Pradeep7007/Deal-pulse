# Stage 1: Build Frontend Assets
FROM node:22-slim AS client-builder
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm install -w client
COPY client/ ./client/
RUN npm run build -w client

# Stage 2: Package and Run Backend with Playwright
FROM node:22-slim
WORKDIR /app

# Copy root workspace and server configuration
COPY package*.json ./
COPY server/package*.json ./server/

# Install server dependencies (including playwright Node package)
RUN npm install -w server

# Install Playwright browser binaries and system dependencies for Chromium
WORKDIR /app/server
RUN npx playwright install --with-deps chromium

WORKDIR /app
# Copy server codebase
COPY server/ ./server/

# Copy compiled frontend assets from client-builder stage
COPY --from=client-builder /app/client/dist ./client/dist

# Default Production Port and Environment
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

# Start server
CMD ["npm", "start", "--prefix", "server"]
