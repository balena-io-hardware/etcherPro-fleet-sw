FROM balenalib/aarch64-debian-node:14-buster-build

WORKDIR /usr/src/app

COPY . .
COPY ./public/expects_example.json /usr/src/diag-data/expects.json
RUN npm install 
RUN apt-get update
RUN apt-get -y install fio
RUN chmod +x ./start.sh
#RUN cd ui && npm i && npm run build

CMD ["./start.sh"]