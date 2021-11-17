import { useEffect, useState } from 'react';
import { Box, Button, Txt } from 'rendition'
import { FioResult } from '../iterfaces/FioResult';

type DrivesPageProps = {
  autoload?: boolean
}

export const Drives = ({ autoload }: DrivesPageProps) => {
  const [drives, setDrives] = useState([] as Array<string>);
  const [fioCallStatus, setFioCallStatus] = useState<"none" | "ok" | "fail">("none");
  const [fioResult, setFioResult] = useState<FioResult | null>(null);

  useEffect(() => {
    if (autoload) {
      (async () => await getDrives())()
    }
  }, [])

  const getDrives = async () => {
    const res = await fetch(`/api/drives`)
    const drivesResponse = await res.json()
    setDrives(drivesResponse);
  } 
  
  const callFioRun = async () => {
    try {
      const fioRun = await fetch(`/api/drives/fio`, { 
        method: 'POST',
        body: JSON.stringify({ 
          devices: drives, 
          bs: "64k", 
          invalidate: 1,
          overwrite: 1
        }),
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      
      if (fioRun.ok) {
        setFioCallStatus("ok")
        let fioRes = await fetch('/api/drives/fio/last')
        setFioResult(await fioRes.json())
      } else {
        setFioCallStatus("fail")
      }
    } catch (error) {
      setFioCallStatus("fail")
    }
  }

  return (
    <>
      { autoload ? <></> :
        <Box>
          <Button onClick={() => getDrives()}>Get available drives</Button>
        </Box> 
      }
      <Box>
        <Txt bold color="#000">{drives.length} drives:</Txt>
        <Button 
          primary={fioCallStatus === "none"} 
          danger={fioCallStatus === "fail"} 
          success={fioCallStatus === "ok"} 
          onClick={() => callFioRun()}
        >
          Run fio
        </Button>
        <Txt italic>Takes about 30 seconds</Txt>
        {
          fioResult !== null ?
          <>
            <Txt>Name: {fioResult.jobs?.[0].jobname} </Txt>
            <Txt>Bandwith: {fioResult.jobs?.[0].write.bw} kb/s </Txt>
            <Box>
              {fioResult.disk_util?.map(d => <Txt>Disk: {d.name} - {d.util}</Txt>)}
            </Box>
          </> : <></>
        }
      </Box>      
    </>
  );
};