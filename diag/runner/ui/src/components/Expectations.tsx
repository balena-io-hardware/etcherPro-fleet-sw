import { useEffect, useState } from 'react';

import { Box, Button } from 'rendition'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheckCircle,
    faQuestionCircle,
    faTimesCircle,
  } from "@fortawesome/free-solid-svg-icons";

import { ExpectationsDict, DiagnosticsState, runChecks } from '../services/ExpectCheck'

export type ExpectsCheckProps = {
    diagState: DiagnosticsState,
    expectations?: ExpectationsDict,
    autorun?: Boolean
}

export const ExpectsCheck = ({ diagState, expectations, autorun }: ExpectsCheckProps) => {
    const [checkState, setCheckState] = useState(
        "notrun" as "notrun" | "ok" | "failed"
    );
    const [checkErrors, setCheckErrors] = useState([] as Array<string>);
    const [expects, setExpects] = useState<ExpectationsDict>({});

    useEffect(() => {
        if (autorun) {
            doCheck()
        }
    }, [autorun])

    const getExpects = async () => {
        if (!expectations) {
            let raw = await fetch(`/api/expects`);    
            const exp = JSON.parse(await raw.json());
            setExpects(exp);
            
            return exp;
        } else {
            setExpects(expectations);
            return expectations;
        }    
    };

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
        // TODO
    }

    return (
        <>
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
        </>
    )
}

export type ExpectsListProps = {
    expects: ExpectationsDict
}

export const ExpectsList = ({expects}: ExpectsListProps) => {
    return (
        <>
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
        </>
    )
}