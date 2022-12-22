gem install fpm --no-document
git clone --recurse-submodules --depth 1 https://github.com/balena-io/etcher
cd etcher
export NODE_OPTIONS="--max-old-space-size=1024"
export PUPPETEER_SKIP_DOWNLOAD=1
sed -i.bak 's/"electron": "12.2.3"/"electron": "^13.5.0"/g' package.json
sed -i.bak 's/"spectron": "14.0.0"/"spectron": "15.0.0"/g' package.json
sed -i.bak 's/"electron-builder": "22.14.13"/"electron-builder": "^23.0.9"/g' package.json
npm install
npm ci
rm node_modules/usb/prebuilds/linux-arm*/node.napi.armv*.node
cd node_modules/usb
npm install
npm run prebuild
cd prebuilds/linux-arm64
mv node.napi.node node.napi.armv8.node
cd ../../../lzma-native
npm install
npm run prebuild
cd ../..
npm run webpack
ELECTRON_BUILDER_ARCHITECTURE=aarch64 USE_SYSTEM_FPM=true node_modules/.bin/electron-builder --linux