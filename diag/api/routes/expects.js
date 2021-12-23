var express = require('express');
var router = express.Router();
var path = require('path')
var fs = require('fs')

/* GET view expectations */
router.get('/', function(req, res, next) {
  try {
    const data = fs.readFileSync(path.join('/usr', "src", "diag-data", "expects.json"), 'utf8')
    res.json(data)
  } catch (err) {
    console.error(err)
    res.sendStatus(501);
  }
});

/* POST set expectations */
router.post('/', function(req, res, next) {
  try {
    fs.writeFileSync(path.join('/usr', "src", "diag-data", "expects.json"), JSON.stringify(req.body))
    res.sendStatus(200);
  } catch (error) {
    console.log(error)
    res.sendStatus(501);
  }  
});

module.exports = router;
