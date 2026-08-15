FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/config/package.json packages/config/
RUN bun install --frozen-lockfile
COPY . .
RUN bun build apps/api/src/index.ts --target bun --outdir dist

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist/index.js ./index.js
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/db ./packages/db
ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "index.js"]
