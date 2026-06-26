###########################
# Production image using local build
###########################
FROM node:20.19.0-alpine AS runner
WORKDIR /quillsocial

# Install only runtime dependencies
RUN apk add --no-cache openssl dumb-init tini && \
    addgroup -S nodejs && \
    adduser -S nextjs -G nodejs

# Set production environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Copy locally built application (standalone build)
COPY --chown=nextjs:nodejs apps/web/.next/standalone ./
COPY --chown=nextjs:nodejs apps/web/.next/static ./apps/web/.next/static
COPY --chown=nextjs:nodejs apps/web/public ./apps/web/public

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Use tini as init system and start the application
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
