FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/api-client/package.json packages/api-client/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/ui/package.json packages/ui/
RUN bun install --frozen-lockfile
COPY apps/api apps/api
COPY packages packages
RUN bun build apps/api/src/index.ts --target bun --outdir dist

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
ENV NODE_ENV=production
USER bun
EXPOSE 3000
CMD ["bun", "dist/index.js"]
