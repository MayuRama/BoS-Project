# Serve pre-built static files with Nginx
# Run 'npm run build' locally before deploying
FROM nginx:stable-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy pre-built dist folder
COPY dist /usr/share/nginx/html

# Copy nginx config (handles React Router SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
