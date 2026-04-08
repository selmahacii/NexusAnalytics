# ── Stage 1: Dependencies ──────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json ./
RUN bun install

# ── Stage 2: Build ─────────────────────────────────────────────
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build Next.js standalone output
RUN bun run build

# ── Stage 3: Runner with seed capability ─────────────────────
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ENV DATABASE_URL="file:/app/db/custom.db"

# Create non-root user (use groupadd/useradd — addgroup/adduser not in bun image)
RUN groupadd -g 1001 appgroup && \
    useradd -r -u 1001 -g appgroup -s /bin/sh appuser

# Copy standalone Next.js server
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./

# Copy static assets and public files
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/public ./public

# Copy Prisma schema
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma

# Copy tsconfig for path alias resolution (@server/*, @/*)
COPY --from=builder --chown=appuser:appgroup /app/tsconfig.json ./tsconfig.json

# Copy server seed and ingestion code
COPY --from=builder --chown=appuser:appgroup /app/server/seed ./server/seed
COPY --from=builder --chown=appuser:appgroup /app/server/ingestion ./server/ingestion
COPY --from=builder --chown=appuser:appgroup /app/server/types ./server/types
COPY --from=builder --chown=appuser:appgroup /app/src/lib/db.ts ./src/lib/db.ts

# Copy package.json for bun to resolve deps
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json

# Install only the runtime deps needed for seeding (xlsx for XLSX parsing)
# This keeps the image lean while enabling the ingestion pipeline
RUN bun install --production

# Copy Prisma client (generated in builder stage)
COPY --from=builder --chown=appuser:appgroup /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=appuser:appgroup /app/node_modules/@prisma ./node_modules/@prisma

# Create directories for database, data, and exports
RUN mkdir -p /app/db /app/db/export /app/data && \
    chown -R appuser:appgroup /app/db /app/data

# Copy entrypoint script
COPY --chown=appuser:appgroup docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod +x /app/docker/entrypoint.sh

# Switch to non-root user
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api || exit 1

ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["start"]
