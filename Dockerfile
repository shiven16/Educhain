FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/

# Expose HTTP API port
EXPOSE 3000

# Expose libp2p port
EXPOSE 4000

CMD ["node", "src/node.js"]