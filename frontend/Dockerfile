# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json only first
COPY package.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force && \
    npm install --no-audit --no-fund --production=false

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set default PORT for Cloud Run
ENV PORT=8080

# Create startup script to inject runtime config and handle PORT env var
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'echo "window.RUNTIME_CONFIG = { BACKEND_URL: \"$BACKEND_URL\" };" > /usr/share/nginx/html/runtime-config.js' >> /docker-entrypoint.sh && \
    echo 'envsubst "\$PORT" < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp && mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose port 8080
EXPOSE 8080

# Start nginx with runtime config injection
CMD ["/docker-entrypoint.sh"]
