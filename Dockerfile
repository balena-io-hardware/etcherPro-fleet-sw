FROM balenalib/aarch64-debian-node:14.17-bullseye-build as builder

RUN apt-get update
RUN apt-get install python3 python2 jq chromium 

# install dependencies

WORKDIR /usr/src/etcher

COPY etcher/scripts scripts
COPY etcher/typings typings
COPY etcher/tsconfig.json etcher/package.json ./

ENV npm_config_disturl=https://electronjs.org/headers
ENV npm_config_runtime=electron
ENV JOBS=1
RUN npm_config_target=$(jq .devDependencies.electron package.json) npm i --openssl_fips=""

### Hot fixing lzma-native
RUN npm i -g prebuildify
WORKDIR /usr/src/etcher/node_modules/lzma-native
RUN npm run prebuild

### Proceed with the rest
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm i

# build sources

WORKDIR /usr/src/etcher

COPY etcher/assets assets
COPY etcher/lib lib
COPY etcher/tsconfig.webpack.json etcher/webpack.config.ts etcher/electron-builder.yml etcher/afterPack.js etcher/afterSignHook.js ./
RUN npm run webpack
RUN PATH=$(pwd)/node_modules/.bin/:$PATH electron-builder --dir --config.asar=false --config.npmRebuild=false --config.nodeGypRebuild=false

WORKDIR /usr/src/app

COPY tsconfig.json update-config-and-start.ts ./
RUN npx tsc update-config-and-start.ts

# runtime image

FROM balenablocks/aarch64-balena-electron-env:v1.2.11
COPY --from=builder /usr/src/etcher/dist/linux-arm64-unpacked/resources/app /usr/src/app
COPY --from=builder /usr/src/etcher/generated /usr/src/app/generated
COPY --from=builder /usr/src/etcher/node_modules/electron/ /usr/src/app/node_modules/electron

WORKDIR /usr/src/app/node_modules/.bin
RUN ln -s ../electron/cli.js electron

RUN apt-get update && apt-get install exfat-fuse lzma

COPY zram.sh /usr/src/app/
COPY screensaver_on.sh screensaver_off.sh /usr/bin/

RUN chmod +x /usr/src/app/zram.sh
RUN chmod +x /usr/bin/screensaver_off.sh
RUN chmod +x /usr/bin/screensaver_on.sh

COPY --from=builder /usr/src/app/update-config-and-start.js /usr/src/app

WORKDIR /usr/src/app
COPY start_cd.elf ./generated/modules/node-raspberrypi-usbboot/blobs/raspberrypi/start_cd.elf

CMD \
	./zram.sh \
	&& node /usr/src/app/update-config-and-start.js

