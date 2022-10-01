FROM node:16.17

COPY package.json .

RUN npm install

COPY . .

CMD ["node", "deploy-commands.js"]
