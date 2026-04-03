# Stage 1: Build the React app
FROM node:18-alpine AS builder

WORKDIR /app

# Set memory limit for Node during build (prevents OOM on Cloud Build)
ENV NODE_OPTIONS=--max-old-space-size=2048

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built files to Nginx's serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (handles React Router SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx cache dirs and fix permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
