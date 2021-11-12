FROM node:15.13.0-alpine

WORKDIR /usr/src/app

COPY . .
RUN npm install 
#RUN cd ui && npm i && npm run build

CMD ["node", "./bin/www"]