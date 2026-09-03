FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY services/extractor ./services/extractor
RUN pnpm install --frozen-lockfile --filter @neo/extractor...
RUN pnpm --filter @neo/extractor build

FROM node:20-alpine
WORKDIR /repo
# pnpm's workspace node_modules are symlinks into the root .pnpm store, so the
# root node_modules must ship alongside the package's own node_modules or the
# symlinks resolve to nothing at runtime.
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/services/extractor/node_modules ./services/extractor/node_modules
COPY --from=build /repo/services/extractor/dist ./services/extractor/dist
COPY --from=build /repo/services/extractor/package.json ./services/extractor/package.json
WORKDIR /repo/services/extractor
EXPOSE 8000
CMD ["node", "dist/server.js"]
