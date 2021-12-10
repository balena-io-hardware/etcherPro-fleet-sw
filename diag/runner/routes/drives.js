var express = require('express');
var router = express.Router();
var fs = require('fs');
var process = require('child_process');
var path = require('path');
var { promisify } = require('util')
var execFileAsync = promisify(process.execFile);

var DiagHistory = require('../services/DiagResult').DiagHistory


/* GET /dev/sd[a-z] drives and /dev/disk/by-path */
router.get('/', async (req, res, next) => {
  try {
    const drives = fs.readdirSync("/dev/disk/by-path")
      .filter(f => f.indexOf('usb') > -1 && f.indexOf("scsi") > -1)
      .map(m => { 
        return { path: m, device: `$/dev/${fs.readlinkSync(`/dev/disk/by-path/${m}`).split("/")[2]}` } 
      })
      .filter(d => d.device.length === 3) // no partitions sda1 sda2 ... 
      
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
    io_size,
    ioengine,
    iodepth,
    fsync,
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
    `--bs=${bs || "1024k"}`,
    `--runtime=${runtime || 10}`,
    '--time_based',
    `--numjobs=${numjobs || 1}`,
    `--name=${name || `etcher_test_${new Date(Date.now()).toISOString()}`}`,
    `--size=${size || '500m'}`,
    `--io_size=${io_size || "10g"}`,
    `--ioengine=${ioengine || "libaio"}`,
    `--iodepth=${iodepth || 32}`,
    `--fsync=${fsync || 10000}`,
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

module.exports = router;
