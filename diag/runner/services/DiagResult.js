const fs = require('fs');
const path = require('path');

class DiagResult {
    _name;
    _path;
    _data;

    constructor(name, filepath) {
        if (!filepath) {
            filepath = '/usr/src'
        }

        this._name = name
        this._path = path.join(filepath, 'diag-data', 'history', name)
    }

    #createDateFolder = (date) => `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}`;

    withData(data) {
        if (this._data) {
            this._data = `${this._data}\n\n${JSON.stringify(data)}`
        } else {
            this._data = JSON.stringify(data);
        }

        return this;
    }

    persist() {
        let now = new Date(Date.now())
        let folderPath = path.join(this._path, this.#createDateFolder(now))

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true })
        }
        fs.writeFileSync(
            path.join(folderPath, `${now.getTime()}.bin`),
            this._data,
        )

        return this;
    }

    list(slug) {
        let currentPath = this._path;
        if (slug) {
            currentPath = path.join(this._path, slug)
        }  

        try {
            const res = fs.readdirSync(currentPath)
    
            return res;
        } catch (error) {
            console.log(error);
        }
    }

    read(fileName) {
        if (!fileName) return;

        try {            
            const fileDate = new Date(parseInt(fileName.split(".")[0]))
            let folderName = this.#createDateFolder(fileDate);
            let currentPath = path.join(this._path, folderName, fileName)
            
            const res = fs.readFileSync(currentPath)
            
            return res;

        } catch (error) {
            console.log(error);
        }
    }
}
const DiagTypes = {
    NETWORK: 'network',
    DRIVES: 'drives',
    LEDS: 'leds'
}

const createDiagResult = (diagType) => new DiagResult(diagType)
const createNetworkResult =  createDiagResult(DiagTypes.NETWORK)
const createLedsResult = createDiagResult(DiagTypes.LEDS)
const createDrivesResult = createDiagResult(DiagTypes.DRIVES)

const listNetworkForDate = (date) => createDiagResult(DiagTypes.NETWORK).list(date)
const listLedsForDate = (date) => createDiagResult(DiagTypes.LEDS).list(date)
const listDrivesForDate = (date) => createDiagResult(DiagTypes.DRIVES).list(date)

const readNetworkFile = (fileName) => createDiagResult(DiagTypes.NETWORK).read(fileName)
const readLedsFile = (fileName) => createDiagResult(DiagTypes.LEDS).read(fileName)
const readDrivesFile = (fileName) => createDiagResult(DiagTypes.DRIVES).read(fileName)


const DiagHistory = {
    createDrivesResult,
    createLedsResult,
    createNetworkResult,
    listNetworkForDate,
    listLedsForDate,
    listDrivesForDate, 
    readNetworkFile,
    readLedsFile,
    readDrivesFile 
}     

module.exports = { 
    DiagResult,
    DiagHistory
}