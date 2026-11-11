FROM docker.io/library/node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392

WORKDIR /opt/project
COPY package.json package-lock.json ./

# La instalación ocurre una sola vez, desde el lockfile, sin scripts de terceros.
RUN npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org/ \
    && chown -R node:node /opt/project

USER node
