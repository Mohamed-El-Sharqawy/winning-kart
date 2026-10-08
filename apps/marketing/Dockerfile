FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/marketing/package.json apps/marketing/
RUN bun install --frozen-lockfile
COPY apps/marketing apps/marketing
RUN cd apps/marketing && bun run build

FROM nginx:alpine
COPY apps/marketing/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/marketing/dist /usr/share/nginx/html
EXPOSE 80
