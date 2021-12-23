var express = require('express');
var os = require('os')
var router = express.Router();

var DiagHistory = require('../services/DiagResult').DiagHistory
var DiagTypes = require('../services/DiagResult').DiagTypes

/* GET list of history types */
router.get('/', function(req, res, next) {
  try {
    let dirs = DiagHistory
      .createDiagResult() // root
      .list()

    
    res.json(dirs);
  } catch (error) {
    res.status(501).send(`Can't list history: ${error}`)
  }
});

// GET dates list for specific type
router.get('/:diagType', (req, res, next) => {
  let { diagType } = req.params
  if (!DiagTypes[diagType]) {
    res.status(403).send("Not implemented type.")
    return
  }

  try {
    let entries = DiagHistory
      .createDiagResult(diagType)
      .list()

    res.json(entries)
    
  } catch (error) {
    res.status(501).send(`Can't list history for '${diagType}' : ${error}`)
  }

})

// GET items for specific date
router.get('/:diagType/:date', (req, res, next) => {
  const { date, diagType } = req.params
  if (!DiagTypes[diagType]) {
    res.status(403).send("Not implemented type.")
    return
  }

  try {
    let entries = DiagHistory
      .createDiagResult(diagType)
      .list(date)

    res.json(entries)
    
  } catch (error) {
    res.status(501).send(`Can't list history for '${diagType}' at '${date}' : ${error}`)
  }
})

// GET details of history file
router.get('/:diagType/view/:fileName', (req, res, next) => {
  const { fileName, diagType } = req.params
  if (!DiagTypes[diagType]) {
    res.status(403).send("Not implemented type.")
    return
  }

  try {
    let conent = DiagHistory
      .createDiagResult(diagType)
      .read(fileName)

    res.send(conent)
    
  } catch (error) {
    res.status(501).send(`Can't view history item '${fileName}' with type '${diagType}' : ${error}`)
  }
  
})

module.exports = router;
