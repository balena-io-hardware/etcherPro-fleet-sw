import { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Txt, Heading, Flex, Button } from 'rendition'

type NetworkInfoProps = {
  onDataReceived?: (data: any) => void,
  onBack?: () => void,
  onNext?: () => void
}

export const NetworkInfo = ({ onDataReceived, onBack, onNext }: NetworkInfoProps) => {
    const [networkInfo, setNetworkInfo] = useState<any>({});

    useEffect(() => {
      (async () => {
        await getNetworkInfo()
      })()
    }, [])

    const getNetworkInfo = async () => {
      try {
        const netRes = await fetch(`/api/network`);
        const netInfo = await netRes.json()
        setNetworkInfo(netInfo)
        if (onDataReceived) {
          onDataReceived(netInfo)
        }
      } catch (err) {
        // call or parsing failed
      }
    }

    return (
      <>
        <Box style={{textAlign: 'left', padding: '10px'}}>
          <Heading.h4>Check network connectivity</Heading.h4>
        </Box>
        <Box style={{wordBreak: 'break-word', padding: '10px 80px 10px 80px'}}>
          <Flex 
            justifyContent={'center'}
            alignItems={'center'}
            alignSelf={'center'}
          >
            <Tabs>
              {Object.keys(networkInfo)
                .map(n => (
                  <Tab title={n}>
                    <ol>
                      {networkInfo[n].map((i: any) => 
                        <li><Txt>{JSON.stringify(i)}</Txt></li>)
                      }
                    </ol>
                  </Tab>)
                ) as any}
            </Tabs>       
          </Flex>
        </Box>
        <Flex 
          alignItems={'flex-end'} 
          height={'100%'} 
          justifyContent={'center'}
          style={{paddingBottom: '30px'}}
        >
          <Button light onClick={() => onBack ? onBack() : null }>Back</Button>&nbsp;
          <Button primary onClick={() => onNext ? onNext() : null }>Finish</Button>&nbsp;
        </Flex>
      </>
    );
  };