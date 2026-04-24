FROM node:trixie-slim AS base
WORKDIR /app
ENV HOME=/home
RUN npm install --global pnpm

FROM base AS build
COPY package.json pnpm-*.yaml ./
RUN pnpm install --include dev
COPY . .
RUN mkdir .local && pnpm build

FROM base AS final
COPY --from=build --chown=1000:1000 /app/.output ./
COPY drizzle drizzle/
COPY drizzle.config.ts ./

ENV TZ=Europe/London PORT=3000 HOSTNAME='0.0.0.0' DB_DIR=/config
RUN rm -rf "$HOME" && mkdir -p "$HOME" "$DB_DIR" && chmod -R ugo+rwX "$HOME" "$DB_DIR"
VOLUME ["$DB_DIR"]
EXPOSE $PORT/tcp
ENV DB_FILE_NAME="file:${DB_DIR}/data.db"
ENTRYPOINT ["node", "server/index.mjs"]
