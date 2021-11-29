FROM balenalib/aarch64-node:14.17-bullseye-build as build

RUN apt-get update
RUN apt-get install python jq

# install etcher dependencies
WORKDIR /usr/src/etcher

COPY etcher/scripts scripts
COPY etcher/typings typings
COPY etcher/tsconfig.json etcher/package-lock.json etcher/package.json ./

RUN npm ci

# build etcher source
WORKDIR /usr/src/etcher

COPY etcher/assets assets
COPY etcher/lib lib
COPY etcher/tsconfig.webpack.json etcher/webpack.config.ts etcher/electron-builder.yml etcher/afterPack.js ./
RUN npm run webpack
RUN npx electron-builder --dir --config.asar=false --config.npmRebuild=false --config.nodeGypRebuild=false

# install config dependencies
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

# build config source
COPY tsconfig.json update-config-and-start.ts ./
RUN npx tsc update-config-and-start.ts

CMD sleep infinity

# use build artifacts in final image
FROM balenablocks/aarch64-balena-electron-env:v1.2.11 as runtime

COPY --from=build /usr/src/etcher/dist/linux-arm64-unpacked/resources/app /usr/src/app
COPY --from=build /usr/src/etcher/node_modules/electron/ /usr/src/app/node_modules/electron

WORKDIR /usr/src/app/node_modules/.bin
RUN ln -s ../electron/cli.js electron

COPY zram.sh /usr/src/app/
COPY screensaver_on.sh screensaver_off.sh /usr/bin/

COPY --from=build /usr/src/app/update-config-and-start.js /usr/src/app

WORKDIR /usr/src/app

CMD \
	./zram.sh \
	&& node /usr/src/app/update-config-and-start.js
