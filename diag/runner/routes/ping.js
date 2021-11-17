var express = require('express');
var router = express.Router();

/* GET ping */
router.get('/', function(req, res, next) {
  res.sendStatus(200);
});

module.exports = router;
