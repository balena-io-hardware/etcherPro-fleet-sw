import { useEffect, useState } from 'react';
import { Box, Button, Txt } from 'rendition'
import { FioResult } from '../iterfaces/FioResult';

type DrivesPageProps = {
  autoload?: boolean
}

export const Drives = ({ autoload }: DrivesPageProps) => {
  const [drives, setDrives] = useState([] as Array<string>);
  const [fioCallStatus, setFioCallStatus] = useState<"none" | "ok" | "fail" | "inprogress">("none");
  const [fioResults, setFioResults] = useState<FioResult[]>([]);

  useEffect(() => {
    if (autoload) {
      (async () => await getDrives())()
    }
  }, [autoload])

  const getDrives = async () => {
    const res = await fetch(`/api/drives`)
    const drivesResponse = await res.json()
    setDrives(drivesResponse);
  } 
  
  const callFioRun = async () => {
    if (fioCallStatus !== 'none') {
      await getDrives();
    }

    setFioCallStatus("inprogress");
    try {
      const fioRun = await fetch(`/api/drives/fio`, { 
        method: 'POST',
        body: JSON.stringify({ 
          devices: drives, 
          bs: "1m", 
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

        setFioResults([...fioResults, await fioRes.json()])
      } else {
        setFioCallStatus("fail")
      }
    } catch (error) {
      setFioCallStatus("fail")
    }
  }

  return (
    <>      
      <Box>
        <Button onClick={() => getDrives()}>Get available drives</Button>
      </Box> 
      <Box>
        <Txt bold color="#000">{drives.length} drives:</Txt>
        <Button 
          primary={fioCallStatus === "none"} 
          danger={fioCallStatus === "fail"} 
          success={fioCallStatus === "ok"} 
          disabled={fioCallStatus === "inprogress"}
          onClick={() => callFioRun()}
        >
          Run fio
        </Button>
        <Txt italic>Takes about 30 seconds</Txt>
        <ol style={{overflowX: 'hidden', overflowY: 'auto'}}>
        {
          fioResults.map((r, i) => 
            <li>
              <Txt>Name: {r.jobs?.[0].jobname} </Txt>
              <Txt>Bandwith: {r.jobs?.[0].write.bw} kb/s </Txt>
              <Box>
                {r.disk_util?.map(d => <Txt>Disk: {d.name} - {d.util}</Txt>)}
              </Box>
            </li>)
        }
        </ol>
      </Box>      
    </>
  );
};