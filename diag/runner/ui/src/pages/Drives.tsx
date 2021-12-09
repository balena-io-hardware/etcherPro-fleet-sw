import { useEffect, useState, useRef } from 'react';
import { Box, Button, HighlightedName, ProgressBar, Table, Txt } from 'rendition'
import { FioResult } from '../iterfaces/FioResult';
import { LedService } from '../services/Leds'

type DrivesPageProps = {
  onDataReceived?: (data: any) => void
  autoload?: boolean
}

type DrivesListItem = {
  path: string //--> /dev/disk/by-path/*
  device: string //--> sd[.] (no /dev at the beginning)
}

type DriveLeds = {
  [index: string]: string[]
}

type ToggleLeds = {
  [index: string]: boolean
}

const useInterval = (callback: Function, delay?: number) => {
  const savedCallback = useRef<Function>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      if (savedCallback && savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== undefined) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export const Drives = ({ autoload, onDataReceived }: DrivesPageProps) => {
  const [drives, setDrives] = useState([] as Array<DrivesListItem>);
  const [fioCallStatus, setFioCallStatus] = useState<"none" | "ok" | "fail" | "inprogress">("none");
  const [fioResults, setFioResults] = useState<FioResult[]>([]);
  const [driveLeds, setDriveLeds] = useState<DriveLeds>({});
  const [toggleLeds, setToggleLeds] = useState<ToggleLeds>({});
  const [fioOneByOneProgress, setFioOneByOneProgress] = useState<number>(0)
  const [fioAllProgress, setFioAllProgress] = useState<number>(0)
  const [fioCallOneByOneInProgress, setFioCallOnebyOneInProgress] = useState<boolean>(false)
  const [fioCallAllInProgress, setFioCallAllInProgress] = useState<boolean>(false)
  

  useEffect(() => {
    if (autoload) {
      (async () => {
        await getDrives()
        await getDriveLeds()
      })()
    }
  }, [autoload])

  useEffect(() => {
    if (fioCallOneByOneInProgress) {
      setFioCallStatus("inprogress")
    } else {
      if (fioOneByOneProgress < 99) {
        setFioCallStatus("fail")
      } else {
        setFioCallStatus("ok")
      }
    }
  }, [fioCallOneByOneInProgress, fioOneByOneProgress])

  useInterval(() => {
    setFioAllProgress(prevState => prevState + 5)
  }, fioCallAllInProgress ? 2100 : undefined)

  const getDrives = async () => {
    const res = await fetch(`/api/drives`)
    const drivesResponse = await res.json()
    setDrives(drivesResponse);
    if (onDataReceived) {
      onDataReceived({ devices: drivesResponse })
    }

    setFioCallStatus("none")
  } 

  const getDriveLeds = async () => {
    const res = await fetch(`/api/supervisor/etcher-config`)
    const configResponse = await res.json()
    setDriveLeds(configResponse['ledsMapping']);
  }
  
  const callFioRunAll = async () => {
    if (fioCallStatus !== 'none') {
      await getDrives();
    }

    setFioAllProgress(0);
    setFioCallAllInProgress(true)
    setFioCallStatus("inprogress")

    try {
      let devices = drives.map(d => `/dev/${d.device}`)
      const fioRun = await fetch(`/api/drives/fio`, { 
        method: 'POST',
        body: JSON.stringify({ 
          devices: devices, 
          invalidate: 1,
          overwrite: 1
        }),
        headers: {
          'Content-Type': 'application/json'
        },
      })
      
      if (fioRun.ok) {
        setFioCallStatus("ok")
        let fioRes = await fetch('/api/drives/fio/last')
        const lastRes = await fioRes.json()
        setFioResults(prevState => [...prevState, lastRes])
        if (onDataReceived) {
          onDataReceived({ devices: drives, results: fioResults })
        }
      } else {
        setFioCallStatus("fail")
      }
    } catch (error) {
      setFioCallStatus("fail")
    }

    setFioCallAllInProgress(false)
  }

  const callFioOneByOne = async () => {
    if (fioCallStatus !== 'none') {
      await getDrives();
    }

    setFioCallOnebyOneInProgress(true)
    setFioOneByOneProgress(0);

    for (let deviceItem of drives) {
      const fioRun = await fetch(`/api/drives/fio`, { 
        method: 'POST',
        body: JSON.stringify({ 
          devices: [`/dev/${deviceItem.device}`], 
          invalidate: 1,
          overwrite: 1
        }),
        headers: {
          'Content-Type': 'application/json'
        },
      })
      
      if (fioRun.ok) {  
        setFioOneByOneProgress(prevState => prevState + (100 / drives.length) ) 

        let fioRes = await fetch('/api/drives/fio/last')
        const lastRes = await fioRes.json()
        
        setFioResults(prevState => [...prevState, lastRes])
        
        if (onDataReceived) {
          onDataReceived({ devices: drives, results: fioResults })
        }
      } 
    }

    setFioCallOnebyOneInProgress(false)

  }

  const handleResultClick = async (device: string) => {
    if (!device.length) return;

    let driveIndex = drives.findIndex(d => d.device === device)

    if (driveIndex > -1) {
      let driveName = drives[driveIndex].path.split("/")[4]
      let led_blue = driveLeds[driveName][2] // led.*_b
    
      if (toggleLeds[driveName]) {
        setToggleLeds(prevState => { return { ...prevState, [driveName]: false } })
        await LedService.callOneLed(led_blue, "0")
      } else {
        setToggleLeds(prevState => { return { ...prevState, [driveName]: true } })
        await LedService.callOneLed(led_blue, "99")
      }
    } else {
      console.error(`device: ${device} mapping cannot be resolved`)
    }
  }

  return (
    <Box style={{overflowY: 'auto'}}>
      <Box>
        <Button onClick={() => getDrives()}>Get available drives</Button>
      </Box>
      <br />
      <Box>
        <HighlightedName>{drives.length +' drives'}</HighlightedName>    
        &nbsp;
        <Button 
          primary={fioCallStatus === "none"} 
          danger={fioCallStatus === "fail"} 
          success={fioCallStatus === "ok"} 
          disabled={fioCallStatus === "inprogress"}
          onClick={() => callFioRunAll()}
        >
          Run fio all
        </Button>
        &nbsp;
        <Button 
          primary={fioCallStatus === "none"} 
          danger={fioCallStatus === "fail"} 
          success={fioCallStatus === "ok"} 
          disabled={fioCallStatus === "inprogress"}
          onClick={() => callFioOneByOne()}
        >
          Run fio 1-by-1
        </Button>
        <Txt italic>Takes about 30 seconds (per call)</Txt>
        {fioCallAllInProgress ? <ProgressBar value={fioAllProgress} /> : <></>}
        {fioCallOneByOneInProgress ? <ProgressBar value={fioOneByOneProgress} /> : <></>}
        <ol style={{paddingBottom: '20vh'}}>
        {
          fioResults.map((r, i) => 
            <>
              <li onClick={() => handleResultClick(`${(r.disk_util && r.disk_util.length === 1) ? r.disk_util[0].name : ""}`)}>
                <Txt>Name: {r.jobs[0].jobname} | Bandwith in MB/s </Txt>
                <Table
                  columns={[
                    {
                      field: 'bw_min',
                      label: 'min',
                      render: (value) => value/1000
                    },
                    {
                      field: 'bw_max',
                      label: 'max',
                      render: (value) => value/1000
                    },
                    {
                      field: 'bw_mean',
                      label: 'mean',
                      render: (value) => value/1000
                    },
                    {
                      field: 'bw_dev',
                      label: 'dev',
                      render: (value) => value/1000
                    },
                  ]}
                  data={[r.jobs[0].write]}
                />
                <Box>
                  <Txt>
                    {r.disk_util?.map(d => <>|- {d.name} : {d.util} -|</>)}
                  </Txt>
                </Box>
              <hr />
              </li>
            </>
            )
        }
        </ol>
      </Box>      
    </Box>
  );
};