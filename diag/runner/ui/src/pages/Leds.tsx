import { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Flex } from 'rendition'

type LedsPageProps = {
  onDataReceived?: (data:any) => void,
  autoload?: Boolean
}

export const Leds = ({ autoload, onDataReceived }: LedsPageProps) => {
  const [leds, setLeds] = useState([] as Array<string>);
  
  useEffect(() => {
    if (autoload) {
      getLeds();
    }
  }, [autoload])

  const getLeds = async () => {
    try {
      const res = await fetch(`/api/leds`)
      const ledResponse = await res.json()
      setLeds(ledResponse);
      if (onDataReceived) {
        onDataReceived(ledResponse)
      }
    } catch (err) {
      // cant get leds
    }    
  }

  const callLed = async (l: string, dashedIntensityOfColors: string) => {
    await fetch(`/api/leds/${l}/${dashedIntensityOfColors}`, { method: 'PUT'})
  }
  
  const callAllLed = async (dashedIntensityOfColors: string) => {
    await fetch(`/api/leds/all/${dashedIntensityOfColors}`, { 
      method: 'POST',
      body: JSON.stringify({ 
        names: leds.filter(l => l.startsWith("led")).map(m => m.split("_")[0]), 
        separator: "_", 
        rString: "r", 
        gString: "g", 
        bString: "b"
      }),
      headers: {
        'Content-Type': 'application/json'
      },
    })
  }

  return (
    <>
      { autoload ? <></> :
        <Box>
          <Button onClick={() => getLeds()}>Get available leds</Button>
        </Box>
      }
      <Box>
        Set all:
        <Button danger onClick={() => callAllLed('99-0-0')}>red</Button>&nbsp;
        <Button success onClick={() => callAllLed('0-99-0')}>green</Button>&nbsp;
        <Button primary onClick={() => callAllLed('0-0-99')}>blue</Button>&nbsp; 
        <Button onClick={() => callAllLed('0-0-0')}>off</Button>&nbsp; 
      </Box>
      
      <Flex flexDirection='row' flexWrap="wrap" style={{padding: '5px', overflowY: 'auto', overflowX: 'hidden'}}>
        {leds && leds.length ? 
          leds.map(led => <Box>
            <ButtonGroup>
              <Button success onClick={() => callLed(led, '00-0-99')}>{led} on</Button>
              <Button outline onClick={() => callLed(led, '0-00-0')}>off</Button>
            </ButtonGroup>
          </Box>) : <></>}
      </Flex>
     
    </>
  );
};