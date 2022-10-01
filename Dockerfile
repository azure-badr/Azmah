FROM node:16.17

COPY package.json .

RUN npm install

COPY . .

RUN cd utils && node deploy-commands.js

CMD ["node", "azmah.js"]