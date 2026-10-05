# ============================================================
# Smart Student Information System — Frontend Dockerfile
# Aditya University | Developer: Vijay
# ============================================================

# Stage 1: Build React + Vite Production Bundle
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with High-Performance Nginx Alpine
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
