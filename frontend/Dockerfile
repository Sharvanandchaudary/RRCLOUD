# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy built app to nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Create startup script
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'envsubst '\''\$BACKEND_URL'\'' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Start nginx with environment substitution
CMD ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
