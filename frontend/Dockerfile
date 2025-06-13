# Etapa de build
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Opcional: copia tu config de nginx si quieres customizar headers
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
