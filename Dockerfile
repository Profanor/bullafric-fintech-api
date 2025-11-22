# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install npm globally
RUN npm install -g npm

# Copy dependency files first (better layer caching)
COPY package*.json ./

# Copy the Prisma schema before install (needed for postinstall)
COPY prisma ./prisma

# Install dependencies (includes prisma generate in postinstall)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the NestJS app
RUN npm run build

# Stage 2: Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only the necessary output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Expose application port
EXPOSE 3001

# Command to run the server
CMD ["node", "dist/main.js"]
