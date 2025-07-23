# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Copy built application and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./

# Expose port 3000
EXPOSE 3000

# Start the SSR server
CMD ["node", "server.js"]