import { useEffect, useState } from 'react';
import { Box, Button, HighlightedName, Table, Txt, Flex, Heading } from 'rendition'
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

export const Drives = ({ autoload, onDataReceived, onBack, onNext }: DrivesPageProps) => {
  const [drives, setDrives] = useState([] as Array<DrivesListItem>);
  const [fioResults, setFioResults] = useState<FioResultDict[]>([]);
  const [driveLeds, setDriveLeds] = useState<DriveLeds>({});
  const [toggleLeds, setToggleLeds] = useState<ToggleLeds>({});
  const [fioOneByOneProgress, setFioOneByOneProgress] = useState<number>(0)
  const [fioAllProgress, setFioAllProgress] = useState<number>(0)
  const [fioCallOneByOneInProgress, setFioCallOnebyOneInProgress] = useState<boolean>(false)
  const [fioCallAllInProgress, setFioCallAllInProgress] = useState<boolean>(false)  
  const [canceled, setCanceled] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:7071')
    ws.onopen = (event) => {
      ws.send("Connected to drives test progress socket");
    };

    ws.onmessage = async (event) => {
      if (event.data === 'cancel') return;

      if (event.data === 'progress') {
        if (fioCallAllInProgress) {
          setFioAllProgress(prev => prev + Math.floor(Math.random() * 10))
        }        
      }

      if (event.data === 'done') {
        let fioRes = await fetch('/api/drives/fio/last')
        const lastRes = parseFioResultToDict(await fioRes.json())  

        setFioResults(prevState => [...prevState, lastRes])
        
        if (onDataReceived) {
          onDataReceived({ devices: drives, results: fioResults })
        }

        if (fioCallAllInProgress) {
          setFioAllProgress(100);
          setFioCallAllInProgress(false);
        } 

        if (fioCallOneByOneInProgress) {
          if (canceled) return;

          setFioOneByOneProgress(prevState => prevState + 1)
          if (fioOneByOneProgress > drives.length) {
            setFioCallOnebyOneInProgress(false)
          } else {
            callFioOneByOne(fioOneByOneProgress);
          }
        }
      }      
    };

    return () => ws.close();
  }, []);

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

  const parseFioResultToDict = (input: FioResult) => {
    return { 
      name: input["global options"].filename,
      data: input.jobs[0].write
    }
  }

  const cancelFio = async () => {
    try {
      const res = await fetch(`/api/drives/fio/cancel`);
      if (res.ok) {
        setFioCallAllInProgress(false);
        setFioCallOnebyOneInProgress(false);
        setCanceled(true);
      }
    } catch (error) {
      console.log(error)
    }
    
  }
  
  const callFioRunAll = async () => {

    setFioAllProgress(1);

    try {
      let devices = drives.map(d => `/dev/${d.device}`)
      const fioStart = await fetch(`/api/drives/fio`, { 
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
      
      if (fioStart.ok) {
        setFioCallAllInProgress(true)        
      } 
    } catch (error) {
      // TODO cancel?
    }
  }

  const callFioOneByOne = async (driveIndex: number) => {    
    if (driveIndex === 0) {
      setCanceled(false)
      setFioOneByOneProgress(1);
    }

    if (canceled) {
      setFioCallOnebyOneInProgress(false)
      return;
    }

    const fioStart = await fetch(`/api/drives/fio`, { 
      method: 'POST',
      body: JSON.stringify({ 
        devices: [`/dev/${drives[driveIndex].device}`], 
        invalidate: 1,
        overwrite: 1
      }),
      headers: {
        'Content-Type': 'application/json'
      },
    })
    
    if (fioStart.ok) {  
      setFioCallOnebyOneInProgress(true)
    } 
    
  }

  const handleResultClick = async (device: string) => {
    console.log(device)
    if (!device.length) return;
    device = device.replace(/\/dev\//,'');

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

  const getSlotNumberByLed = (device: string) => {
    if (!device.length) return;
    if (device.indexOf(":") > -1) return `1 to ${drives.length}`

    device = device.replace(/\/dev\//,''); // remove '/dev/' if any
    let driveIndex = drives.findIndex(d => d.device === device)

    if (driveIndex > -1) {
      let driveName = drives[driveIndex].path
      let ledOne = driveLeds[driveName][0] // led.*_r
      const numberPattern = /\d+/g;
      return ledOne.match(numberPattern)?.join('')
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
          paddingBottom={'10px'}
        >      
          <Box width={'210px'}>

            <ProgressButton  
              type='flashing'
              progressText='Writing...'
              active={fioCallAllInProgress}
              percentage={fioAllProgress}
              position={fioAllProgress}
              disabled={false}
              cancel={()=> cancelFio()}
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
              progressText='Writing...'
              active={fioCallOneByOneInProgress}
              percentage={Math.round(fioOneByOneProgress / drives.length  * 100)}
              position={Math.round(fioOneByOneProgress / drives.length  * 100)}
              disabled={false}
              cancel={()=> cancelFio()}
              warning={false}
              callback={() => callFioOneByOne(0)}
              text='Write independently'
            /> 
          </Box>          
        </Flex>  
        <Table
          onRowClick={(row) => handleResultClick(row.name)}
          rowKey='name'
          columns={[
            {
              field: 'name',
              label: 'Drive number',
              render: (value) => <Txt bold>{ getSlotNumberByLed(value) }</Txt>
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