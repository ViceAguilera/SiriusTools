FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# El build empaqueta las dependencias del servidor dentro de dist/ (ssr.noExternal en astro.config.mjs),
# así la imagen final no lleva node_modules.
FROM node:24-alpine
# yt-dlp en un entorno de Python aparte. [default] trae yt-dlp-ejs, que usa Node (ya está en la imagen)
# para resolver los desafíos de JavaScript de YouTube; sin eso los videos salen "no disponibles".
# ffmpeg convierte a MP3/FLAC y une audio y video en MP4.
# bgutil-ytdlp-pot-provider pide tokens PO al contenedor bgutil cuando YTDLP_POT_URL está definida.
RUN apk add --no-cache python3 ffmpeg \
  && python3 -m venv /opt/yt-dlp \
  && /opt/yt-dlp/bin/pip install --no-cache-dir 'yt-dlp[default]' bgutil-ytdlp-pot-provider==2.0.2
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=9002 YTDLP_PATH=/opt/yt-dlp/bin/yt-dlp
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 9002
CMD ["node", "dist/server/entry.mjs"]
