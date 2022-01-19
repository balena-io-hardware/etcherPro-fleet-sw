import { useState } from 'react';
import { Route, Switch, useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import { Button, Steps, Step, Heading, Flex } from 'rendition'
import { Leds } from './Leds';
import { Drives } from './Drives';
import { NetworkInfo } from './NetworkInfo';
import { DiagnosticsState } from '../services/ExpectCheck';
// import { ExpectsCheck } from '../components/Expectations'

type DiagStepsProps = {
  onClose: () => void
}

export const DiagSteps = ({ onClose }: DiagStepsProps) => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [diagState, setDiagState] = useState<DiagnosticsState>({})
    
    const { path } = useRouteMatch()
    let history = useHistory()
    let location = useLocation()
    const query = new URLSearchParams(location.search);
    
    const nextStep = (toSlug: string) => {
      setCurrentStep(currentStep + 1);
      history.push(`${path}/${toSlug}`)
    }

    const prevStep = (toSlug: string) => {
      setCurrentStep(currentStep - 1);
      history.push(`${path}/${toSlug}`)
    }

    const finishSteps = () => {
      return onClose ? onClose() : null;
    }

    const onDiagData = (data: any, diagType: string) => {
      setDiagState({
        ...diagState,
        [diagType]: data
      })
    } 

    return (
      <>
        <Steps
          activeStepIndex={currentStep}
          bordered
          onClose={() => finishSteps()}
          ordered
        >
          <Step status={currentStep > 0 ? "completed" : "pending"}>
            Leds
          </Step>
          <Step status={currentStep > 1 ? "completed" : "pending"}>
            Touchpanel
          </Step>
          <Step status={currentStep > 2 ? "completed" : "pending"}>
            Drives
          </Step>
          <Step status={currentStep > 3 ? "completed" : "pending"}>
            Network
          </Step>
          {/* <Step status="pending">
            Serial
          </Step> */}
        </Steps>
        <Switch>
          <Route path={`${path}/(leds|start)`}>        
            <Leds
              autoload 
              onDataReceived={(data) => onDiagData(data, 'leds')} 
              onNext={() => nextStep('screen')}
            />
          </Route>
          <Route path={`${path}/screen`}>
            <Heading.h4 
              style={{ zIndex: 9999 }} 
              className='add-fab'
            >
              Tap the boxes
            </Heading.h4>    
            <Flex 
              alignItems={'flex-end'} 
              justifyContent={'center'}
              style={{position: 'absolute', left: '30%', right: '30%', bottom: '30px', zIndex: 999}}
            >
              <Button light onClick={() => prevStep('start') }>Back</Button>&nbsp;
              <Button primary onClick={() =>  nextStep('drives') }>Next</Button>&nbsp;
            </Flex>  
            <iframe 
              className="App-frame" 
              src={location.search.indexOf('rows') > -1 ? `/screen?rows=${query.get('rows')}` : '/screen?rows=2'} 
              title='screen' 
              key="screen-frame"
            ></iframe>
          </Route>
          <Route path={`${path}/drives`}>
            <Drives 
              autoload 
              onDataReceived={(data) => onDiagData(data, 'drives')}
              onBack={() => prevStep('screen')}
              onNext={() => nextStep('network')}
            />
          </Route>
          <Route path={`${path}/network`}>
            <NetworkInfo 
              onDataReceived={(data) => onDiagData(data, 'network')}
              onBack={() => prevStep('drives')}
              onNext={() => finishSteps()}
            />
          </Route>
          {/* <Route path={`${path}/serial`}>
            <ExpectsCheck diagState={diagState} autorun={true}/>
          </Route> */}
        </Switch>
      </>
    );
  };