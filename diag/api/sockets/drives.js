var createWss = require('./socket')

const drivesWs = createWss(7071);

module.exports = drivesWs;