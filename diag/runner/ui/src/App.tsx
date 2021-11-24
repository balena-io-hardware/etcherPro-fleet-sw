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
  const [checkState, setCheckState] = useState(
    "notrun" as "notrun" | "ok" | "failed"
  );
  const [checkErrors, setCheckErrors] = useState([] as Array<string>);
  const [expects, setExpects] = useState<ExpectationsDict>({});
  const location = useLocation();

  useEffect(() => {
    getExpects();
  }, []);

  const closeScreenFrame = () => {
    setShowScreen(false);
  };

  const openScreenFrame = () => {
    setShowScreen(true);
  };

  const getExpects = async () => {
    let raw = await fetch(`/expects/expects.json`);
    const exp = JSON.parse(await raw.text());
    setExpects(exp);

    return exp;
  };

  const doCheck = async () => {
    setCheckErrors([]);
    const exp = await getExpects();

    // TODO: remove test data
    let state: DiagnosticsState = {
      leds: ["led0", "led0", "led0", "led0"],
      drives: ["led0", "led0", "led0", "led0"],
    } as DiagnosticsState;

    let { success, errors } = runChecks(state, exp);

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
                  panel: <Leds />,
                },
                {
                  label: "Write speed",
                  panel: (
                    <>
                      <Drives />
                    </>
                  ),
                },
                {
                  label: "Network",
                  panel: (
                    <>
                      <NetworkInfo />
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
