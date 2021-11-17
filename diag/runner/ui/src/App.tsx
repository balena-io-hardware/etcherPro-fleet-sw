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
import { DiagSteps } from './pages/DiagSteps';
import { Leds } from './pages/Leds';
import { Drives } from './pages/Drives';

function App() {
  const [showScreen, setShowScreen] = useState(false);
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
    // let state = {
    //   leds
    // } as { [index: string]: any}

    // let operators = {
    //   eq,
    //   ne,
    //   gt,
    //   lt,
    // } as { [index: string] : any }

    // let hasFail = Object.keys(expects).map(k => {
    //   return expects[k].map(m => {        
    //     if (!operators[m.op](getMethod(m.method, state[k]), m.value)) {
    //       setCheckState('failed');
    //       setCheckErrors([...checkErrors, `${k}: ${m.method} expected to be ${m.op} ${m.value} but was ${getMethod(m.method, state[k])}`])
    //       return false;
    //     }
    //     return true;
    //   }).some(success => !success)
    // }).some(hasFail => hasFail)

    // if (!hasFail) { setCheckState('ok') }
  }

  const burnSerial = () => {
    console.log('burrn');    
  }

  return (
    <div className="App">
      {location && location.pathname.startsWith("/manual") ? 
        <Navbar
          brand={<RouterLink to="/"><Link color="white">HW Diag</Link></RouterLink>}
          color="white"
          >
          <RouterLink to="/manual/expectations">
            <Link color="white">Expectations</Link>
          </RouterLink>
          <RouterLink to="/screen">
            <Link color="white">Screen</Link>
          </RouterLink>
          <RouterLink to="/diagsteps/start">
            <Link color="white">Diag steps</Link>
          </RouterLink>
        </Navbar> : <></>
      }
        <Switch>
          <Route path="/diagsteps">
            <DiagSteps />
          </Route>
          <Route path="/screen">
            <ScreenTest />
          </Route>
          <Route path="/manual/expectations">
              <ul>
                {Object.keys(expects).map(k => <>
                  <li>
                    {k}: <ol>{expects[k].map(e => <li>[{e.method}] is '{e.op}' <b>{e.value}</b></li>)}</ol>
                  </li>
                </>)}
              </ul>
          </Route>
          <Route path="/manual">
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
                    panel: <Leds />                      
                  },
                  {
                    label: 'Write speed',
                    panel: 
                      <>
                        <Drives />
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
    </div>        
  );
}

export default App;
