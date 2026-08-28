FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @neo/backend build

FROM node:20-alpine
RUN corepack enable
WORKDIR /repo
COPY --from=build /repo /repo
WORKDIR /repo/apps/backend
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
