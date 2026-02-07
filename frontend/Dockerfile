# Build Stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Default nginx config is fine for simple SPA usually, but for React Router we typically need to redirect 404s to index.html
# Creating a simple custom config inline using a shell trick or copying a file.
# For simplicity in this prototype, we'll bank on default nginx. If router issues occur on refresh, we need a custom nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
