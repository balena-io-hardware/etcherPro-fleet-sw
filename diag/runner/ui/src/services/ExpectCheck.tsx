type Expectation = {
    method: string, 
    op: keyof typeof Operators, 
    value: string | number
}

export type ExpectationsDict = { [index: string]: Expectation[] }
export type DiagnosticsState = { [index: string]: any }

const Operators = {
    eq : (a: any, b: any) => a === b,
    ne : (a: any, b: any) => a !== b,
    gt : (a: any, b: any) => a > b,
    lt : (a: any, b: any) => a < b
}

const getMethod = (propString: string, obj: any) => {
    if (!propString || !obj) return obj;

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

export const runChecks = (
    state: DiagnosticsState,
    expects: ExpectationsDict
) => {
    let errors: string[] = []   
    let hasFail = Object.keys(expects)
        .map(k => 
            expects[k]
                .map(m => {        
                        if (!Operators[m.op](getMethod(m.method, state[k]), m.value)) {                            
                            errors.push(`${k}: [${m.method}] expected to be '${m.op}' "${m.value}" but was "${getMethod(m.method, state[k])}"`)
                            return false;
                        }
                        return true;
                    }
                ).some(success => !success)
        ).some(hasFail => hasFail)
    
    return { success: !hasFail, errors };
}
