FROM node:25-alpine

ARG VERSION=dev
ARG VCS_REF=dev
ARG BUILD_DATE=unknown

LABEL maintainer="SAATH maintainers" \
    org.opencontainers.image.title="saath-api" \
    org.opencontainers.image.description="SAATH private family wellness and workout API with administrator-managed accounts." \
    org.opencontainers.image.source="https://github.com/sanjaymaverick-cmd/SAATH" \
    org.opencontainers.image.url="https://github.com/sanjaymaverick-cmd/SAATH" \
    org.opencontainers.image.documentation="https://github.com/sanjaymaverick-cmd/SAATH#readme" \
    org.opencontainers.image.licenses="AGPL-3.0-or-later" \
    org.opencontainers.image.version=$VERSION \
    org.opencontainers.image.revision=$VCS_REF \
    org.opencontainers.image.created=$BUILD_DATE

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force
COPY server.js auth.js adherence.js bootstrap-admin.js ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "server.js"]

HEALTHCHECK --interval=5m \
            --timeout=5s \
            --retries=3 \
            CMD wget --spider -q "http://127.0.0.1:${PORT}/api/health" || exit 1
