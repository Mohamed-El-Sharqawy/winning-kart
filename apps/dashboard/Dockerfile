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
COPY apps/dashboard apps/dashboard
COPY packages packages
RUN cd apps/dashboard && bun run build

FROM nginx:alpine
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/dashboard/dist /usr/share/nginx/html
EXPOSE 80
