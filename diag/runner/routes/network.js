var express = require('express');
var os = require('os')
var router = express.Router();

var DiagHistory = require('../services/DiagResult').DiagHistory

/* GET home page. */
router.get('/', function(req, res, next) {
  const networks = os.networkInterfaces();

  DiagHistory
    .createNetworkResult
    .withData(networks)
    .persist()

  res.json(networks);
});

router.get('/results/list', (req, res, next) => {
  let entries = DiagHistory.listNetworkForDate()

  res.json(entries)
})

router.get('/results/list/:date', (req, res, next) => {
  const { date } = req.params
  let entries = DiagHistory.listNetworkForDate(date)

  res.json(entries)
})

router.get('/results/view/:fileName', (req, res, next) => {
  const { fileName } = req.params
  let content = DiagHistory.readNetworkFile(fileName)

  res.send(content)
})

module.exports = router;
