# Use Node.js 20 Alpine (lightweight)
FROM node:20-alpine

# Create working directory inside container
WORKDIR /app

# Copy package.json and package-lock/pnpm files first (for better caching)
COPY package*.json ./

# Install node app dependencies
RUN npm install --omit=dev

# Install required system utilities (for PDFs and crypto ops)
RUN apk add --no-cache bash

# Copy source code
COPY . .

# Expose HTTP + P2P ports
EXPOSE 3000 4000

# Start a node instance (Node.js runtime)
CMD ["node", "src/node.js"]
