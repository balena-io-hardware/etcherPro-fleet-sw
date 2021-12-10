import { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Flex } from 'rendition'

import { LedService } from '../services/Leds'

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
      const ledResponse = (await LedService.getLeds())
        .filter((l: string) => l.startsWith("led"))
        .sort((a: string, b: string) => {
          if (a.length < b.length) return -1;
          if (b.length < a.length) return 1;
          if (a < b) return -1;
          if (b < a) return 1;
          return 0;
        })

      setLeds(ledResponse);
      if (onDataReceived) {
        onDataReceived(ledResponse)
      }
    } catch (err) {
      // cant get leds
    }    
  }

  const callLed = async (l: string, intensityOfColor: string) => {
    await LedService.callOneLed(l, intensityOfColor)
  }
  
  const callAllLed = async (dashedIntensityOfColors: string) => {
    await LedService.callAllLeds(
      dashedIntensityOfColors,
      leds.filter(l => l.startsWith("led")).map(m => m.split("_")[0]),
      "_",
      "r",
      "g",
      "b"
    )
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
        <Button light onClick={() => callAllLed('99-99-99')}>white</Button>&nbsp; 
        <Button onClick={() => callAllLed('0-0-0')}>off</Button>&nbsp; 
      </Box>
      
      <Flex flexDirection='row' flexWrap="wrap" style={{padding: '5px', overflowY: 'auto', overflowX: 'hidden'}}>
        {leds && leds.length ? 
          leds.map(led => <Box>
            <ButtonGroup>
              <Button success onClick={() => callLed(led, '99')}>{led} on</Button>
              <Button outline onClick={() => callLed(led, '0')}>off</Button>
            </ButtonGroup>
          </Box>) : <></>}
      </Flex>
     
    </>
  );
};