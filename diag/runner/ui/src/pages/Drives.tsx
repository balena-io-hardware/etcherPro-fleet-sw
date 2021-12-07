import { useEffect, useState } from 'react';
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

export const Drives = ({ autoload, onDataReceived }: DrivesPageProps) => {
  const [drives, setDrives] = useState([] as Array<DrivesListItem>);
  const [fioCallStatus, setFioCallStatus] = useState<"none" | "ok" | "fail" | "inprogress">("none");
  const [fioResults, setFioResults] = useState<FioResult[]>([]);
  const [driveLeds, setDriveLeds] = useState<DriveLeds>({});
  const [toggleLeds, setToggleLeds] = useState<ToggleLeds>({});
  const [fioProgress, setFioProgress] = useState<number>(0)

  useEffect(() => {
    if (autoload) {
      (async () => {
        await getDrives()
        await getDriveLeds()
      })()
    }
  }, [autoload])

  const getDrives = async () => {
    const res = await fetch(`/api/drives`)
    const drivesResponse = await res.json()
    setDrives(drivesResponse);
    if (onDataReceived) {
      onDataReceived({ devices: drivesResponse })
    }
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

    setFioCallStatus("inprogress");
    setFioProgress(0);
    let progressTime = setInterval(() => setFioProgress(prevState => prevState+5), 2100)

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

    clearInterval(progressTime)
  }

  const callFioOneByOne = async () => {
    setFioCallStatus("inprogress");
    setFioProgress(0);

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
        setFioProgress(prevState => prevState + (100 / drives.length) ) 

        let fioRes = await fetch('/api/drives/fio/last')
        const lastRes = await fioRes.json()
        
        setFioResults(prevState => [...prevState, lastRes])
        
        if (onDataReceived) {
          onDataReceived({ devices: drives, results: fioResults })
        }
      } 
    }

    // wait a bit and check if all the calls were good
    setTimeout(() => {
      if (fioProgress < 99) {
        setFioCallStatus("fail")
      } else {
        setFioCallStatus("ok")
      }
    }, 1000);
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
        {fioCallStatus === "inprogress" ? <ProgressBar value={fioProgress} /> : <></>}
        <ol style={{paddingBottom: '20vh'}}>
        {
          fioResults.map((r, i) => 
            <>
              <li onClick={() => handleResultClick(`${(r.disk_util && r.disk_util.length === 1) ? r.disk_util[0].name : ""}`)}>
                <Txt>Name: {r.jobs[0].jobname} | Bandwith in kb/s </Txt>
                <Table
                  columns={[
                    {
                      field: 'bw_min',
                      label: 'min'
                    },
                    {
                      field: 'bw_max',
                      label: 'max'
                    },
                    {
                      field: 'bw_mean',
                      label: 'mean'
                    },
                    {
                      field: 'bw_dev',
                      label: 'dev'
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