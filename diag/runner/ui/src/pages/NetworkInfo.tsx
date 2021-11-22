import { ReactElement, useEffect, useState } from 'react';
import { Accordion, Box, Txt } from 'rendition'

export const NetworkInfo = () => {
    const [networkInfo, setNetworkInfo] = useState<any>({});

    useEffect(() => {
      (async () => {
        await getNetworkInfo()
      })()
    })

    const getNetworkInfo = async () => {
      const netRes = await fetch(`/api/network`);
      setNetworkInfo(await netRes.json())
    }

    return (
      <Box style={{overflowY: 'auto', paddingBottom: '50vh'}}>
        <Accordion
          items={Object.keys(networkInfo)
            .map(n => ({ label: n, panel: <Txt>{JSON.stringify(networkInfo[n])}</Txt>})) as any}
        />           
      </Box>
    );
  };