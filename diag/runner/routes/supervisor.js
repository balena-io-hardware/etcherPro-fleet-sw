var fs = require('fs')
var express = require('express');
var router = express.Router();

/* GET url */
router.get('/url', function(req, res, next) {  
  res.send(process.env.BALENA_SUPERVISOR_ADDRESS);
});

router.get('/apiKey', function(req, res, next) {  
  res.send(process.env.BALENA_SUPERVISOR_API_KEY);
});

router.get('/appid', function(req, res, next) {  
  res.send(process.env.BALENA_APP_ID);
});

router.get('/createlock', function(req, res, next) {  
  fs.writeFileSync('/usr/src/diag-data/startup.lock', "startlock")
  fs.writeFileSync('/usr/src/diag-data/start.url',
   `${process.env.BALENA_SUPERVISOR_ADDRESS}/v2/applications/${process.env.BALENA_APP_ID}/start-service?apikey=${process.env.BALENA_SUPERVISOR_API_KEY}`
   )
  res.sendStatus(200)
});

router.get('/etcher-config', function(req, res, next) {  
  try {
    let config = fs.readFileSync(" /root/.config/balena-etcher/config.json")
    res.json(JSON.parse(config))
  } catch (error) {
    res.status(501).send(error)
  }
});

module.exports = router;
