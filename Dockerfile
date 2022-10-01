FROM node:16.17

COPY package.json .

RUN npm install

COPY . .

RUN node deploy-commands.js

CMD ["node", "azmah.js"]
