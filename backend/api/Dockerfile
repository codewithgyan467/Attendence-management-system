FROM node:22-alpine AS builder

WORKDIR /app

# Copy the local package files
COPY package.json ./

# Install dependencies (using flags to bypass Arborist edgesOut bug in npm v10)
RUN npm install --no-package-lock --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Generate Prisma and Build
RUN npx prisma generate
RUN npm run build

# --- Production Image ---
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD sh -c "npx prisma db push --accept-data-loss && npx tsx prisma/seed.ts && npm run start:prod"
