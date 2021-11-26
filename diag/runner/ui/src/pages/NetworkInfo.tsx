import { ReactElement, useEffect, useState } from 'react';
import { Accordion, Box, Txt } from 'rendition'

type NetworkInfoProps = {
  onDataReceived?: (data: any) => void
}

export const NetworkInfo = ({ onDataReceived }: NetworkInfoProps) => {
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
      <Box style={{overflowY: 'auto', paddingBottom: '50vh'}}>
        <Accordion
          items={Object.keys(networkInfo)
            .map(n => ({ label: n, panel: 
              <ol>
                {networkInfo[n].map((i: any) => 
                  <li><Txt>{JSON.stringify(i)}</Txt></li>)
                }
              </ol>})
            ) as any}
        />           
      </Box>
    );
  };