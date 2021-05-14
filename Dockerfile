FROM balenalib/aarch64-debian-node:12.16-buster-build as builder

RUN apt-get update
RUN apt-get install python jq

WORKDIR /usr/src/etcher

COPY etcher/scripts scripts
COPY etcher/typings typings
COPY etcher/tsconfig.json etcher/npm-shrinkwrap.json etcher/package.json ./

ENV npm_config_disturl=https://electronjs.org/headers
ENV npm_config_runtime=electron
RUN npm_config_target=$(jq .devDependencies.electron package.json) npm i

COPY etcher/assets assets
COPY etcher/lib lib
COPY etcher/tsconfig.webpack.json etcher/webpack.config.ts etcher/electron-builder.yml etcher/afterPack.js ./
RUN npm run webpack
RUN PATH=$(pwd)/node_modules/.bin/:$PATH electron-builder --dir --config.asar=false --config.npmRebuild=false --config.nodeGypRebuild=false

FROM balenablocks/aarch64-balena-electron-env:v1.2.5

COPY --from=builder /usr/src/etcher/dist/linux-arm64-unpacked/resources/app /usr/src/app
COPY --from=builder /usr/src/etcher/node_modules/electron/ /usr/src/app/node_modules/electron

WORKDIR /usr/src/app/node_modules/.bin
RUN ln -s ../electron/cli.js electron

COPY update-config-and-start.js zram.sh /usr/src/app/
COPY screensaver_on.sh screensaver_off.sh /usr/bin/

WORKDIR /usr/src/app

CMD \
	./zram.sh \
	&& node /usr/src/app/update-config-and-start.js
