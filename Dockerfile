# Build stage
FROM ghcr.io/puppeteer/puppeteer:latest as builder

# Switch to root for initial setup
USER root

# Set the working directory
WORKDIR /usr/src/app

# Create node_modules directory and set permissions
RUN mkdir -p /usr/src/app/node_modules && \
    chown -R pptruser:pptruser /usr/src/app

# Switch to pptruser for the rest of the build
USER pptruser

# Copy package.json and yarn.lock
COPY --chown=pptruser:pptruser package.json yarn.lock ./

# Install all dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY --chown=pptruser:pptruser . .

# Build the application
RUN yarn build:prod

# Production stage
FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root for initial setup
USER root

# Set the working directory
WORKDIR /usr/src/app

# Create necessary directories and set permissions
RUN mkdir -p /usr/src/app/node_modules /usr/src/app/dist && \
    chown -R pptruser:pptruser /usr/src/app

# Switch to pptruser for the rest of the operations
USER pptruser

# Copy package.json and yarn.lock
COPY --chown=pptruser:pptruser package.json yarn.lock ./

# Install production dependencies
RUN yarn install --frozen-lockfile --production

# Copy built assets from builder stage
COPY --from=builder --chown=pptruser:pptruser /usr/src/app/dist ./dist

# Expose the port the app runs on
EXPOSE 8080

# Run the web service on container startup
CMD [ "npm", "run", "start:cloud-run" ]