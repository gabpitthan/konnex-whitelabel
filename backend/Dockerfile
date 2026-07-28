FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends git python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY tsconfig.json .sequelizerc ./
COPY src ./src
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates ffmpeg chromium && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/database ./src/database
COPY .sequelizerc ./
RUN mkdir -p public private logs certs \
    && chown -R node:node /app/public /app/private /app/logs /app/certs
USER node
CMD ["sh","-c","npx sequelize db:migrate && if [ \"${RUN_DB_SEEDS:-false}\" = \"true\" ]; then npx sequelize db:seed:all; fi && node dist/server.js"]
