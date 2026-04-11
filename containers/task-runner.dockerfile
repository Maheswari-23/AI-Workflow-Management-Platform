# Task Runner Container
# Lightweight container for executing individual workflow tasks

FROM node:18-alpine

# Install required tools
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    py3-pip

# Create app directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy task execution code
COPY backend/src ./src
COPY backend/task-runner.js ./

# Create directories for task data
RUN mkdir -p /app/data /app/logs

# Set environment
ENV NODE_ENV=production
ENV TASK_MODE=container

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Run task
ENTRYPOINT ["node", "task-runner.js"]
