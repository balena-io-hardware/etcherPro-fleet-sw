FROM balenalib/aarch64-alpine-node:14.17 as builder
RUN install_packages bash libx11-dev libxscrnsaver-dev autoconf automake libtool p7zip git python3 python2 gcc g++ ruby-dev make libx11-dev libxkbfile-dev fakeroot rpm libsecret-dev jq python2-dev py3-pip py-setuptools eudev-dev\
    util-linux-dev squashfs-tools

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY tsconfig.json update-config-and-start.ts ./
RUN npm i && npx tsc update-config-and-start.ts

WORKDIR /usr/src/
COPY etcher etcher
COPY build-etcher.sh ./build-etcher.sh
#Ensure we clear the balena builder cache to fetch latest etcher
#ADD "https://api.github.com/repos/balena-io/etcher/commits?per_page=1" etcher_latest_commit
ENV USE_SYSTEM_7ZA=true
RUN mkdir -p /root/.cache/electron-builder/appimage/appimage-12.0.1/linux-arm64/
RUN ln -s `which mksquashfs` /root/.cache/electron-builder/appimage/appimage-12.0.1/linux-arm64/mksquashfs

RUN chmod +x ./build-etcher.sh && ./build-etcher.sh

# runtime image
FROM balenablocks/aarch64-balena-electron-env:alpine
# COPY --from=builder /usr/src/etcher/dist/linux-arm64-unpacked/resources/app /usr/src/app
COPY --from=builder /usr/src/etcher/generated /usr/src/app
COPY --from=builder /usr/src/etcher/node_modules/electron/ /usr/src/app/node_modules/electron

WORKDIR /usr/src/app/node_modules/.bin
RUN ln -s ../electron/cli.js electron

RUN apk update && apk add fuse xz-dev docker glib-networking util-linux mesa-dri-gallium libproxy-bin glib-networking eudev

COPY zram.sh /usr/src/app/
COPY screensaver_on.sh screensaver_off.sh /usr/bin/

RUN chmod +x /usr/src/app/zram.sh
RUN chmod +x /usr/bin/screensaver_off.sh
RUN chmod +x /usr/bin/screensaver_on.sh

COPY --from=builder /usr/src/app/update-config-and-start.js /usr/src/app

WORKDIR /usr/src/app
# correct .elf is part of etcher-sdk since 7.4.2
#COPY start_cd.elf ./generated/modules/node-raspberrypi-usbboot/blobs/raspberrypi/start_cd.elf

CMD \
  docker image prune -a -f \
	&& ./zram.sh \
	&& node /usr/src/app/update-config-and-start.js
