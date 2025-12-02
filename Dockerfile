FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Patch broken logger
COPY src/logger.js node_modules/@libp2p/logger/dist/src/index.js



# Copy source code
COPY src/ ./src/

# Expose HTTP API port
EXPOSE 3000

# Expose libp2p port
EXPOSE 4000

CMD ["node", "src/node.js"]