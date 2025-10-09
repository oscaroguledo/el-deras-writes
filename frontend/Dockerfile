FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm cache clean --force && npm ci

COPY . ./

CMD ["./node_modules/.bin/vite", "--host", "0.0.0.0"]
