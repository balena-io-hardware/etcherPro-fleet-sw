gem install fpm --no-document
cd etcher
export NODE_OPTIONS="--max-old-space-size=1024"
export PUPPETEER_SKIP_DOWNLOAD=1
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