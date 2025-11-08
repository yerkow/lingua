FROM registry.abu.edu.kz/docker-hub/node:22 as base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
RUN apt-get update && apt-get install -y openssl

FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --registry https://npm.abu.edu.kz/repository/registry/

FROM base as builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpx prisma generate
RUN pnpm run build

FROM base
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./
EXPOSE 3003
CMD ["node", "dist/main.js"]
