FROM node:slim AS build
WORKDIR /app
COPY frontend/*.json frontend/*.config ./
RUN npm install
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm run build

FROM node:slim
# better-sqlite3 doesn't have binaries for node23
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y openssl tini python3 make g++
WORKDIR /app
COPY backend/*.json backend/*.ts ./
RUN npm install
COPY backend/src ./src
COPY backend/drizzle ./drizzle
RUN npm run build

ENV TZ=Europe/London HTTP_PORT=3000 FRONTEND_DIR=/app/public DB_DIR=/config LOG_LEVEL=HTTP
ENTRYPOINT ["/usr/bin/tini", "-e", "143", "--"]
RUN mkdir -p "$DB_DIR" && chmod 777 "$DB_DIR"
COPY --from=build /app/build "$FRONTEND_DIR"
VOLUME ["$DB_DIR"]
EXPOSE $HTTP_PORT/tcp
CMD ["node", "dist/src/index.js"]
