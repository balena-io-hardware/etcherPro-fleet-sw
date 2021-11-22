import { useState } from 'react';
import { Route, Switch, useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import { Button, Steps, Step } from 'rendition'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Leds } from './Leds';
import { Drives } from './Drives';
import { NetworkInfo } from './NetworkInfo';

export const DiagSteps = () => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [showScreen, setShowScreen] = useState(true);

    const { path } = useRouteMatch()
    let history = useHistory()
    let location = useLocation()
    const query = new URLSearchParams(location.search);
    
    const nextStep = (toSlug: string) => {
      setCurrentStep(currentStep + 1);
      history.push(`${path}/${toSlug}`)
    }

    const closeScreenFrame = () => {
      setShowScreen(false);  
    }
  
    const openScreenFrame = () => {
      setShowScreen(true);  
    }

    return (
      <>
        <Steps
          activeStepIndex={currentStep}
          bordered
          onClose={() => {}}
          ordered
        >
          <Step status={currentStep > 0 ? "completed" : "pending"}>
            Leds
          </Step>
          <Step status={currentStep > 1 ? "completed" : "pending"}>
            Screen
          </Step>
          <Step status={currentStep > 2 ? "completed" : "pending"}>
            Drives
          </Step>
          <Step status={currentStep > 3 ? "completed" : "pending"}>
            Network
          </Step>
          <Step status="pending">
            Serial
          </Step>
        </Steps>
        <Switch>
          <Route path={`${path}/(leds|start)`}>
            <Button primary onClick={() => nextStep('screen')}>Next</Button>
            <br />
            <Leds autoload/>
          </Route>
          <Route path={`${path}/screen`}>
            <Button primary onClick={() => nextStep('drives')}>Insert all the drives and Next</Button>
            <br />
            <Button primary onClick={() => openScreenFrame()}>Open screen test</Button>
            {showScreen ? <>
              <Button 
                primary
                onClick={() => closeScreenFrame()}
                className="add-fab"
                padding='13px'
                width={23}  
                style={{ zIndex: 9999 }}              
                icon={<FontAwesomeIcon icon={faTimes}/>}
              />/
              <Button 
                success
                onClick={() => { closeScreenFrame(); nextStep('drives') }}
                className="add-fab"
                padding='13px'               
                
                icon={<FontAwesomeIcon icon={faTimes}/>}
              >Close and next</Button>
              <iframe 
                className="App-frame" 
                src={location.search.indexOf('rows') > -1 ? `/screen?rows=${query.get('rows')}` : '/screen'} 
                title='screen' 
                key="screen-frame"
              ></iframe>
            </> : <></>}
          </Route>
          <Route path={`${path}/drives`}>
            <Button primary onClick={() => nextStep('network')}>Next</Button>
            <br />
            <Drives autoload/>
          </Route>
          <Route path={`${path}/network`}>
            <Button primary onClick={() => nextStep('serial')}>Next</Button>
            <br />
            <NetworkInfo/>
          </Route>
          <Route path={`${path}/serial`}>
            serial TBD
          </Route>
        </Switch>
      </>
    );
  };