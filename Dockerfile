# Stage 1: Build the React application
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY tracertrail/package.json tracertrail/package-lock.json ./
RUN npm ci

# Copy the application source code
COPY tracertrail/ .
RUN npm run build

# Stage 2: Serve with Node.js
FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY tracertrail/package.json tracertrail/package-lock.json ./
RUN npm ci --omit=dev

# Copy built frontend from build stage
# app.js expects dist to be at ../dist relative to server/app.js
# So if app.js is at /app/tracertrail/server/app.js, dist should be at /app/tracertrail/dist
COPY --from=build /app/dist ./tracertrail/dist

# Copy backend code
COPY tracertrail/server ./tracertrail/server

# Set environment
ENV NODE_ENV=production
ENV PORT=80

# Expose port
EXPOSE 80

# Define volume for persistence (uploads and sqlite db)
VOLUME ["/app/tracertrail/server/storage"]

# Start server
CMD ["node", "tracertrail/server/app.js"]
