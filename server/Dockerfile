FROM node:24-alpine

WORKDIR /app

COPY package.json ./
COPY bun.lock* package-lock.json* ./

RUN npm install

COPY . .

EXPOSE 8001

CMD ["npm", "start"]
