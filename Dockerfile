# ---- Build ----
FROM node:24-slim AS build

WORKDIR /app

# Install from the committed lockfile first so this layer is cached.
# .npmrc disables dependency install scripts (see SECURITY.md).
COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ---- Runtime ----
FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build

RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "# Configuration generated at startup" > .env' >> /app/entrypoint.sh && \
    echo 'echo "DEFAULT_PROVIDER=${DEFAULT_PROVIDER:-ollama}" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "# Ollama Configuration (Local AI models)" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "OLLAMA_API_BASE=http://host.docker.internal:11434" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "# LM Studio Configuration (Local AI models)" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "LM_STUDIO_API_BASE=http://host.docker.internal:1234/v1" >> .env' >> /app/entrypoint.sh && \
    echo 'exec "$@"' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

RUN groupadd -r appuser && useradd -r -g appuser -u 1001 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/app/entrypoint.sh"]
# Variables set on the container win over the generated .env
CMD ["node", "--env-file-if-exists=.env", "build"]
