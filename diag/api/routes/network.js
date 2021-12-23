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

module.exports = router;
