# Minimal image for the presence sidecar.
FROM node:22-alpine

WORKDIR /app

# Install deps against the lockfile only when manifests change.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY index.mjs ./

CMD ["node", "index.mjs"]
