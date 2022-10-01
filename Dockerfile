FROM node:16.17

COPY package.json .

RUN npm install

CMD ["node", "azmah.js"]
