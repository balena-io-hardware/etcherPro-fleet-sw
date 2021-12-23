FROM balenalib/aarch64-alpine-node:14-latest

WORKDIR /usr/src/app

COPY ./api ./api
COPY ./ui/build ./ui/build
COPY ./start.sh ./start.sh

RUN cd api && npm install
RUN chmod +x ./start.sh

RUN apk add fio

CMD ["./start.sh"]