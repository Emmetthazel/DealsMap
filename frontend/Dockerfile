FROM node:20

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm cache clean --force && npm install --legacy-peer-deps

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]