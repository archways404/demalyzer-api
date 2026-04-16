FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY src ./src

RUN mkdir -p /app/data

EXPOSE 5622

CMD ["node", "src/server.js"]