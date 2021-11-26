import React, { useEffect, useState } from "react";
import { Accordion, Box, Button, Link, Navbar } from "rendition";
import {
  faTimes,
  faCheckCircle,
  faQuestionCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Switch,
  Route,
  Link as RouterLink,
  useLocation,
} from "react-router-dom";

import "./App.css";
import { ScreenTest } from "./pages/ScreenTest";
import { DiagSteps } from "./pages/DiagSteps";
import { Leds } from "./pages/Leds";
import { Drives } from "./pages/Drives";
import { NetworkInfo } from "./pages/NetworkInfo";
import {
  runChecks,
  DiagnosticsState,
  ExpectationsDict,
} from "./services/ExpectCheck";

function App() {
  const [showScreen, setShowScreen] = useState(false);
  const [diagState, setDiagState] = useState<DiagnosticsState>({})
  const [checkState, setCheckState] = useState(
    "notrun" as "notrun" | "ok" | "failed"
  );
  const [checkErrors, setCheckErrors] = useState([] as Array<string>);
  const [expects, setExpects] = useState<ExpectationsDict>({});
  const location = useLocation();

  useEffect(() => {
    (async () => await getExpects())()
  }, []);

  const closeScreenFrame = () => {
    setShowScreen(false);
  };

  const openScreenFrame = () => {
    setShowScreen(true);
  };

  const getExpects = async () => {
    let raw = await fetch(`/api/expects`);    
    const exp = JSON.parse(await raw.json());
    setExpects(exp);

    return exp;
  };

  const onDiagData = (data: any, diagType: string) => {
    setDiagState({
      ...diagState,
      [diagType]: data
    })
  }  

  const doCheck = async () => {
    setCheckErrors([]);
    const exp = await getExpects();

    let { success, errors } = runChecks(diagState, exp);

    if (success) {
      setCheckState("ok");
    } else {
      setCheckState("failed");
      setCheckErrors(errors);
    }
  };

  const burnSerial = () => {
    console.log("burrn");
  };

  return (
    <div className="App">
      {location && location.pathname.startsWith("/manual") ? (
        <Navbar
          brand={
            <RouterLink to="/">
              <Link color="white">HW Diag</Link>
            </RouterLink>
          }
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
        </Navbar>
      ) : (
        <></>
      )}
      <Switch>
        <Route path="/diagsteps">
          <DiagSteps />
        </Route>
        <Route path="/screen">
          <ScreenTest />
        </Route>
        <Route path="/manual/expectations">
          <ul>
            {Object.keys(expects).map((k) => (
              <>
                <li>
                  {k}:{" "}
                  <ol>
                    {expects[k].map((e) => (
                      <li>
                        [{e.method}] is '{e.op}' <b>{e.value}</b>
                      </li>
                    ))}
                  </ol>
                </li>
              </>
            ))}
          </ul>
        </Route>
        <Route path="/manual">
          <Accordion
            items={
              [
                {
                  label: "Screen",
                  panel: (
                    <Box>
                      <Button onClick={() => openScreenFrame()}>
                        Open screen test
                      </Button>
                    </Box>
                  ),
                },
                {
                  label: "Leds",
                  panel: <Leds onDataReceived={(data) => onDiagData(data, "leds")}/>,
                },
                {
                  label: "Write speed",
                  panel: (
                    <>
                      <Drives onDataReceived={(data) => onDiagData(data, "drives")}/>
                    </>
                  ),
                },
                {
                  label: "Network",
                  panel: (
                    <>
                      <NetworkInfo onDataReceived={(data) => onDiagData(data, "network")} />
                    </>
                  ),
                },
                {
                  label: "Mark test complete",
                  panel: (
                    <Box>
                      <Button onClick={() => doCheck()}>
                        Check expectations
                      </Button>
                      &nbsp;
                      {checkState === "ok" ? (
                        <Button
                          success
                          confirmation={{
                            placement: "top",
                            text: "Are you sure?",
                          }}
                          onClick={() => burnSerial()}
                          icon={
                            <FontAwesomeIcon
                              color="green"
                              icon={faCheckCircle}
                            />
                          }
                        >
                          Burn serial
                        </Button>
                      ) : (
                        <></>
                      )}
                      {checkState === "failed" ? (
                        <Button
                          danger
                          icon={
                            <FontAwesomeIcon color="red" icon={faTimesCircle} />
                          }
                        >
                          Burn serial
                        </Button>
                      ) : (
                        <></>
                      )}
                      {checkState === "notrun" ? (
                        <Button
                          disabled
                          icon={
                            <FontAwesomeIcon
                              color="gray"
                              icon={faQuestionCircle}
                            />
                          }
                        >
                          Burn serial
                        </Button>
                      ) : (
                        <></>
                      )}
                      {checkErrors.length ? (
                        <ol>
                          {checkErrors.map((e) => (
                            <li>{e}</li>
                          ))}
                        </ol>
                      ) : (
                        <></>
                      )}
                    </Box>
                  ),
                },
              ] as any
            }
          />
          {showScreen ? (
            <>
              <Button
                primary
                onClick={() => closeScreenFrame()}
                className="add-fab"
                padding="13px"
                style={{ borderRadius: "100%" }}
                width={23}
                icon={<FontAwesomeIcon icon={faTimes} />}
              />
              <iframe
                className="App-frame"
                src={`/screen`}
                title="screen"
                key="screen-frame"
              ></iframe>
            </>
          ) : (
            <></>
          )}
        </Route>
      </Switch>
    </div>
  );
}

export default App;
