var express = require('express');
var router = express.Router();
var fs = require('fs');
var process = require('child_process');
var path = require('path');
var { promisify } = require('util')
var execFileAsync = promisify(process.execFile);

var DiagHistory = require('../services/DiagResult').DiagHistory


/* GET sd[a-z] drives */
router.get('/', async (req, res, next) => {
  try {
    const drives = fs.readdirSync("/dev")
      .filter(f => f.startsWith('sd') && f.length === 3)
      .map(m => `/dev/${m}`)
      
    res.json(drives);
  } catch {
    res.sendStatus(501)
  }
});

router.post('/fio', async (req, res, next) => {
  const { 
    devices, 
    rw, 
    direct, 
    bs,
    runtime, 
    numjobs, 
    name, 
    size,
    invalidate,
    overwrite,
    output_format
  } = req.body;

  if (!devices || !devices.length) {
    console.log("No device specified (eg. `/dev/sda`). Do not run `fio` on system drive.")
    res.sendStatus(403);
    return;
  }

  const fileName = devices.join(":");
  let parameters = [
    `--filename=${fileName}`,
    `--direct=${direct || 0}`,
    `--rw=${rw || "write"}`,
    `--bs=${bs || "4k"}`,
    `--runtime=${runtime || 20}`,
    '--time_based',
    `--numjobs=${numjobs || 8}`,
    `--name=${name || `etcher_test_${new Date(Date.now()).toISOString()}`}`,
    `--size=${size || '1g'}`,
    `--invalidate=${invalidate || 0}`,
    `--overwrite=${overwrite || 0}`,
    '--group_reporting',
    `--output-format=${output_format || "json"}`
  ]

  const { stdout } = await execFileAsync('fio', parameters)
  try {
    DiagHistory
      .createDrivesResult
      .withData(stdout)
      .persist()

    fs.writeFileSync(path.join(__dirname, 'last_fio_result.json'), stdout)
  } catch (err) {
    console.error(err)
    res.sendStatus(501);
    return;
  }

  res.sendStatus(201)
})

router.get('/fio/last', async (req, res, next) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'last_fio_result.json'), 'utf8')
    res.json(JSON.parse(data))
  } catch (err) {
    console.error(err)
    res.sendStatus(501);
  }
})

router.get('/results/list', (req, res, next) => {
  let entries = DiagHistory.listDrivesForDate()

  res.json(entries)
})

router.get('/results/list/:date', (req, res, next) => {
  const { date } = req.params
  let entries = DiagHistory.listDrivesForDate(date)

  res.json(entries)
})

router.get('/results/view/:fileName', (req, res, next) => {
  const { fileName } = req.params
  let content = DiagHistory.readDrivesFile(fileName)

  res.send(content)
})

module.exports = router;
