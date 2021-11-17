import { useState } from 'react';
import { Route, Switch, useRouteMatch, useHistory } from 'react-router-dom';
import { Button, Steps, Step, Box } from 'rendition'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Leds } from './Leds';
import { Drives } from './Drives';

export const DiagSteps = () => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [showScreen, setShowScreen] = useState(true);

    const { path } = useRouteMatch()
    let history = useHistory()
    
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
          <Route path={`${path}/drives`}>
            <Button primary onClick={() => nextStep('serial')}>Next</Button>
            <br />
            <Drives autoload/>
          </Route>
          <Route path={`${path}/serial`}>
            serial TBD
          </Route>
        </Switch>
      </>
    );
  };