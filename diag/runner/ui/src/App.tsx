import React, { useEffect, useState } from 'react';
import { 
  Accordion,
  Box,
  Button,
  Link,
  Navbar,
} from 'rendition';
import { 
  faTimes, 
  faCheckCircle, 
  faQuestionCircle, 
  faTimesCircle 
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Switch, Route, Link as RouterLink, useLocation } from 'react-router-dom';

import './App.css';
import { ScreenTest } from './pages/ScreenTest'

function App() {
  const [showScreen, setShowScreen] = useState(false);
  const [leds, setLeds] = useState([] as Array<string>);
  const [checkState, setCheckState] = useState("notrun" as "notrun" | "ok" | "failed")
  const [checkErrors, setCheckErrors] = useState([] as Array<string>)
  const [expects, setExpects] = useState({} as { [index: string]: Array<{ method: string, op: string, value: string | number }> });
  const location = useLocation()

  useEffect(() => {
    getExpects()
  }, [])

  const closeScreenFrame = () => {
    setShowScreen(false);  
  }

  const openScreenFrame = () => {
    setShowScreen(true);  
  }

  const getLeds = async () => {
    const res = await fetch(`/api/leds`)
    const ledResponse = await res.json()
    setLeds(ledResponse);
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
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  }
  const getExpects = async () => {
    let raw = await fetch(`/expects/expects.json`)
    setExpects(JSON.parse(await raw.text()))
  }

  const eq = (a: any, b: any) => a === b
  const ne = (a: any, b: any) => a !== b
  const gt = (a: any, b: any) => a > b
  const lt = (a: any, b: any) => a < b

  const getMethod = (propString: string, obj: any) => {
    if (!propString)
    return obj;

    var prop, props = propString.split('.');

    for (var i = 0, iLen = props.length - 1; i < iLen; i++) {
      prop = props[i];

      var candidate = obj[prop];
      if (candidate !== undefined) {
        obj = candidate;
      } else {
        break;
      }
    }
    return obj[props[i]];
  }

  const runChecks = () => {
    setCheckErrors([]);
    let state = {
      leds
    } as { [index: string]: any}

    let operators = {
      eq,
      ne,
      gt,
      lt,
    } as { [index: string] : any }

    let hasFail = Object.keys(expects).map(k => {
      return expects[k].map(m => {        
        if (!operators[m.op](getMethod(m.method, state[k]), m.value)) {
          setCheckState('failed');
          setCheckErrors([...checkErrors, `${k}: ${m.method} expected to be ${m.op} ${m.value} but was ${getMethod(m.method, state[k])}`])
          return false;
        }
        return true;
      }).some(success => !success)
    }).some(hasFail => hasFail)

    if (!hasFail) { setCheckState('ok') }
  }

  const burnSerial = () => {
    console.log('burrn');    
  }

  return (
    <div className="App">
      {location && location.pathname==="/screen" ? <ScreenTest /> : <>
        <Navbar
          brand={<RouterLink to="/"><Link color="white">HW Diag</Link></RouterLink>}
          color="white"
          >
          <RouterLink to="/expectations">
            <Link color="white">Expectations</Link>
          </RouterLink>
          <RouterLink to="/screen">
            <Link color="white">Screen</Link>
          </RouterLink>
        </Navbar>
      
        <Switch>
          <Route path="/expectations">
              <ul>
                {Object.keys(expects).map(k => <>
                  <li>
                    {k}: <ol>{expects[k].map(e => <li>[{e.method}] is '{e.op}' <b>{e.value}</b></li>)}</ol>
                  </li>
                </>)}
              </ul>
          </Route>
          <Route path="/">
                <Accordion items={[
                  {
                    label: 'Screen',
                    panel: 
                      <Box>
                        <Button onClick={() => openScreenFrame()}>Open screen test</Button>
                      </Box>
                  },
                  {
                    label: 'Leds',
                    panel: 
                      <>
                        <Box>
                          <Button onClick={() => getLeds()}>Get available leds</Button>
                        </Box>
                        <Box>
                          Set all:
                          <Button danger onClick={() => callAllLed('99-0-0')}>red</Button>&nbsp;
                          <Button success onClick={() => callAllLed('0-99-0')}>green</Button>&nbsp;
                          <Button primary onClick={() => callAllLed('0-0-99')}>blue</Button>&nbsp; 
                          <Button onClick={() => callAllLed('0-0-0')}>off</Button>&nbsp; 
                        </Box>
                        <ol>
                          {leds && leds.length ? 
                            leds.map(led => <li style={{margin: '5px'}}>
                              {led}: &nbsp;
                              <Button danger onClick={() => callLed(led, '99-0-0')}>red</Button>&nbsp;
                              <Button success onClick={() => callLed(led, '0-99-0')}>green</Button>&nbsp;
                              <Button primary onClick={() => callLed(led, '0-0-99')}>blue</Button>&nbsp;
                            </li>) : <></>}
                        </ol>
                      </>
                  },
                  {
                    label: 'Write speed',
                    panel: 
                      <>
                        TBD
                      </>
                  },
                  {
                    label: 'Mark test complete',
                    panel:
                      <Box>
                        <Button onClick={() => runChecks()}>Check expectations</Button>&nbsp;
                        {checkState === 'ok' ? <Button success confirmation={{ placement: 'top', text: 'Are you sure?' }} onClick={() => burnSerial()} icon={<FontAwesomeIcon color='green' icon={faCheckCircle} />}>Burn serial</Button> : <></> }
                        {checkState === 'failed' ? <Button danger icon={<FontAwesomeIcon color='red' icon={faTimesCircle} />}>Burn serial</Button> : <></> }
                        {checkState === 'notrun' ? <Button disabled icon={<FontAwesomeIcon color='gray' icon={faQuestionCircle} />}>Burn serial</Button> : <></> }
                        {checkErrors.length ? 
                        <ol>
                          {checkErrors.map(e => <li>{e}</li>)}
                        </ol>
                        : <></>}
                      </Box>
                  }
                ] as any} 
                />
              {showScreen ? <>
              <Button 
                primary
                onClick={() => closeScreenFrame()}
                className="add-fab"
                padding='13px'
                style={{ borderRadius: '100%'}}
                width={23}
                icon={<FontAwesomeIcon icon={faTimes}/>}
                />
              <iframe className="App-frame" src={`/screen`} title='screen' key="screen-frame"></iframe>
              </> : <></>}
          </Route>
        </Switch>
        </> }
    </div>        
  );
}

export default App;
