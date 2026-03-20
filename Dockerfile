FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies for all workspaces
FROM base AS deps
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
COPY packages/types/package*.json ./packages/types/
RUN npm ci

# Build shared types
FROM deps AS build
COPY packages/types ./packages/types
COPY backend ./backend
COPY frontend ./frontend
RUN npm run build

# Production image
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY packages/types/package*.json ./packages/types/
RUN npm ci --omit=dev --workspace=backend --workspace=packages/types

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./backend/dist/public
COPY --from=build /app/packages/types/dist ./packages/types/dist

EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
