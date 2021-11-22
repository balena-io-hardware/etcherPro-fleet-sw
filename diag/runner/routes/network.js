var express = require('express');
var os = require('os')
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const networks = os.networkInterfaces();

  res.json(networks);
});

module.exports = router;
