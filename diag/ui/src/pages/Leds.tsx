import { useEffect, useState } from 'react';
import { Box, Button, Flex, Heading } from 'rendition'

import { LedService } from '../services/Leds'

type LedsPageProps = {
  onDataReceived?: (data:any) => void,
  onBack?: () => void,
  onNext?: () => void,
  autoload?: Boolean
}

export const Leds = ({ autoload, onDataReceived, onBack, onNext }: LedsPageProps) => {
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
      <Box style={{textAlign: 'left', padding: '10px'}}>
        <Heading.h4>Set LED color</Heading.h4>
      </Box>
      { autoload ? <></> :
        <Box>
          <Button onClick={() => getLeds()}>Get available leds</Button>
        </Box>
      }
      <Flex 
        style={{wordSpacing: '1.5em'}}
        alignItems={'center'} 
        height={'80%'} 
        justifyContent={'center'}
      >
        <Button danger width={'100px'}  onClick={() => callAllLed('99-0-0')}>Red</Button>&nbsp;
        <Button success width={'100px'} onClick={() => callAllLed('0-99-0')}>Green</Button>&nbsp;
        <Button primary width={'100px'} onClick={() => callAllLed('0-0-99')}>Blue</Button>&nbsp; 
      </Flex>
      <Flex 
        style={{wordSpacing: '1.5em'}}
        alignItems={'center'} 
        justifyContent={'center'}
      >
        <Button outline width={'100px'} onClick={() => callAllLed('99-99-99')}>White</Button>&nbsp; 
        <Button tertiary width={'100px'} onClick={() => callAllLed('0-0-0')}>OFF</Button>&nbsp; 
      </Flex>

      <Flex 
        alignItems={'flex-end'} 
        height={'100%'} 
        justifyContent={'center'}
        style={{paddingBottom: '30px'}}
      >
        <Button light onClick={() => onBack ? onBack() : null }>Back</Button>&nbsp;
        <Button primary onClick={() => onNext ? onNext() : null }>Next</Button>&nbsp;
      </Flex>
     
    </>
  );
};