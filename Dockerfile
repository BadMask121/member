# Use the official lightweight Node.js 18 image for building the application.
FROM node:18-slim as builder

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package.json yarn.lock ./

# Install all dependencies.
RUN yarn install --frozen-lockfile

# Copy local code to the container image.
COPY . ./

# Build the application.
RUN yarn build

# Use a separate stage for the final image to keep it small.
FROM node:18-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy only the production dependencies.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy the built application from the builder stage.
COPY --from=builder /usr/src/app/dist ./dist

# Run the web service on container startup.
CMD [ "npm", "run", "start:cloud-run" ]
