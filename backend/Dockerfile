# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app .

# Create uploads directory
RUN mkdir -p uploads

# Cloud Run best practice:
# Do NOT hardcode ports
# Cloud Run provides PORT=8080
EXPOSE 8080

# Health check MUST use $PORT, not 5001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 8080; require('http').get({host:'127.0.0.1', port, path:'/health'}, r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start server
CMD ["node", "server.js"]
