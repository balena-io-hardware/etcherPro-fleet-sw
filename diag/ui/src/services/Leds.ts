const getLeds = async () => {
    try {
        const res = await fetch(`/api/leds`)
        const ledsResponse = await res.json()
    
        return ledsResponse
    } catch (error) {
        console.log("Can't list leds", error)
        return [];
    }
}

const callOneLed = async (l: string, intensityOfColor: string) => {
    try {
        await fetch(`/api/leds/${l}/${intensityOfColor}`, { method: 'PUT'})
    } catch (error) {
        console.log("Can't update led", error)
    }
}
  
const callAllLeds = async (
    dashedIntensityOfColors: string, 
    leds: string[],
    separator: string,
    rString: string,
    gString: string,
    bString: string
) => {
    try {
        await fetch(`/api/leds/all/${dashedIntensityOfColors}`, { 
            method: 'POST',
            body: JSON.stringify({ 
                names: leds, 
                separator, 
                rString, 
                gString, 
                bString
            }),
            headers: {
            'Content-Type': 'application/json'
            },
        })
    } catch (error) {
        console.log("Can't set leds", error)
    }
}

export const LedService = { getLeds, callOneLed, callAllLeds }