import { type } from 'os';
import { useEffect, useState, useRef } from 'react';
import { Box, Button, HighlightedName, ProgressBar, Table, Txt, Flex, Heading } from 'rendition'
import { ProgressButton } from '../components/progress-button/progress-button';
import { FioResult, ReadOrWriteOrTrim } from '../iterfaces/FioResult';
import { LedService } from '../services/Leds'

type DrivesPageProps = {
  onDataReceived?: (data: any) => void
  onBack?: () => void,
  onNext?: () => void,
  autoload?: boolean
}

type FioResultDict = {
  name: string,
  data: ReadOrWriteOrTrim
}

type DrivesListItem = {
  path: string //--> from /dev/disk/by-path/* (no path at the beginning)
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

export const Drives = ({ autoload, onDataReceived, onBack, onNext }: DrivesPageProps) => {
  const [drives, setDrives] = useState([] as Array<DrivesListItem>);
  const [fioCallStatus, setFioCallStatus] = useState<"none" | "ok" | "fail" | "inprogress">("none");
  const [fioResults, setFioResults] = useState<FioResultDict[]>([]);
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
    setFioAllProgress(prevState => prevState + 2)
  }, fioCallAllInProgress ? 800 : undefined)

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

    setFioAllProgress(2);
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

  const parseFioResultToDict = (input: FioResult) => {
   return { 
     name: input["global options"].filename,
     data: input.jobs[0].write
    }
  }

  const callFioOneByOne = async () => {
    if (fioCallStatus !== 'none') {
      await getDrives();
    }

    setFioCallOnebyOneInProgress(true)
    setFioOneByOneProgress(2);

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
      
      //if (true) {  
      if (fioRun.ok) {  
        setFioOneByOneProgress(prevState => prevState + (100 / drives.length) ) 

        let fioRes = await fetch('/api/drives/fio/last')
        const lastRes = parseFioResultToDict(await fioRes.json())  
        
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
      let driveName = drives[driveIndex].path
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
    <>
      <Box style={{textAlign: 'left', padding: '10px 0 0 10px '}}>
        <Heading.h4>Write data to drives</Heading.h4>
      </Box>
      <Box style={{overflowY: 'auto'}}>
        <Flex 
          alignItems={'center'}
          justifyContent={'center'}
        >      
          <Box width={'210px'}>

            <ProgressButton  
              type='flashing'
              active={fioCallAllInProgress}
              percentage={fioAllProgress}
              position={0}
              disabled={false}
              cancel={()=> setFioCallAllInProgress(false)}
              warning={false}
              callback={() => callFioRunAll()}
              text='Write simultaneously'
            />
          </Box>  
          <Box>
            &nbsp;
            <HighlightedName>{drives.length +' drives'}</HighlightedName>
            &nbsp;
          </Box>
          <Box width={'210px'}>
            <ProgressButton  
              type='flashing'
              active={fioCallOneByOneInProgress}
              percentage={fioOneByOneProgress}
              position={0}
              disabled={false}
              cancel={()=> setFioCallOnebyOneInProgress(false)}
              warning={false}
              callback={() => callFioOneByOne()}
              text='Write independently'
            /> 
          </Box>          
        </Flex>  
        <Table
          onRowClick={(row) => handleResultClick(row.name)}
          columns={[
            {
              field: 'name',
              label: 'Drive number',
              render: (value) => <Txt bold>{ fioResults.findIndex((v) => v.name == value)+1 }</Txt>
            },
            {                        
              field: 'data',
              key: 'avg',
              label: 'Average',
              render: (value) => <Txt bold>{`${(value.bw_mean/1000).toFixed(2)} MB/s`}</Txt>
            },
            {
              field: 'data',
              key: 'max',
              label: 'Max',
              render: (value) => `${(value.bw_max/1000).toFixed(2)} MB/s`
            },
            {
              field: 'data',
              key: 'min',
              label: 'Min', 
              render: (value) => `${(value.bw_min/1000).toFixed(2)} MB/s`
            },
            {
              field: 'data',
              key: 'bw',
              label: 'Bandwith',
              render: (value) => `${(value.bw/1000).toFixed(2)} MB/s`
            },
          ]}
          data={fioResults}
        />
      </Box>
      <Flex 
          alignItems={'flex-end'} 
          justifyContent={'center'}
          style={{padding: '15px 0 15px 0' }}
        >
          <Button light onClick={() => onBack ? onBack() : null }>Back</Button>&nbsp;
          <Button primary onClick={() => onNext ? onNext() : null }>Next</Button>&nbsp;
        </Flex>
    </>
  );
};