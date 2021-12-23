type Expectation = {
    property: string, 
    op: keyof typeof Operators, 
    expected: string | number,
    func?: { args: string, body: string, name: string }
}

export type ExpectationsDict = { [index: string]: Expectation[] }
export type DiagnosticsState = { [index: string]: any }

const Operators = {
    eq : (a: any, b: any) => a === b,
    ne : (a: any, b: any) => a !== b,
    gt : (a: any, b: any) => a > b,
    lt : (a: any, b: any) => a < b
}

const getMethod = (e: Expectation, obj: any) => {
    if (!obj) return obj;
    if (!e.property) { 
        if (!e.func) return obj;

        // run func on obj in absence of property
        // eslint-disable-next-line no-new-func
        let fun = new Function(e.func.args, e.func.body)
        return fun(obj)
    } 

    var prop, props = e.property.split('.');

    for (var i = 0, iLen = props.length - 1; i < iLen; i++) {
      prop = props[i];

      var candidate = obj[prop];
      if (candidate !== undefined) {
        obj = candidate;
      } else {
        break;
      }
    }

    if (e.func) {
        // run through the function
        // eslint-disable-next-line no-new-func
        let fun = new Function(e.func.args, e.func.body)
        let res = fun(obj[props[i]])
        return res;
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
                        let val = getMethod(m, state[k]) 
                        if (!Operators[m.op](val, m.expected)) {                            
                            errors.push(`${k}: [${m.property || (m.func?.name && `${m.func.name}(${m.property || k})`)}] expected to be '${m.op}' "${m.expected}" but was "${val}"`)
                            return false;
                        }
                        return true;
                    }
                ).some(success => !success)
        ).some(hasFail => hasFail)
    
    return { success: !hasFail, errors };
}
