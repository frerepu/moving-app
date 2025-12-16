FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --production

COPY . .

# Create data directory
RUN mkdir -p /app/data/uploads

EXPOSE 3001

CMD ["node", "server.js"]
