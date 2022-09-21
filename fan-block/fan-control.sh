#!/bin/bash

# Exits on failure
set -e

# Get environment variables, set default values to match etcherPro
FAN_GPIO=${FAN_GPIO:-132}
THERMAL_ZONE=/sys/class/thermal/thermal_zone${THERMAL_ZONE:-0}/temp
THERMAL_HIGH=${THERMAL_HIGH:-60}000
THERMAL_LOW=${THERMAL_LOW:-40}000
REFRESH_DELAY=${REFRESH_DELAY:-60}
PWM_PERIOD=${PWM_PERIOD:-40000}
PWM_TEMPS=${PWM_TEMPS:-"0,40,50,70"}
PWM_DUTY=${PWM_DUTY:-"0,200,10000,40000"}

setup_gpio() {
# First, set GPIO as output
if [[ -d /sys/class/gpio/gpio${FAN_GPIO} ]]; then
   echo -n ${FAN_GPIO} > /sys/class/gpio/unexport
fi

echo -n ${FAN_GPIO} > /sys/class/gpio/export
echo -n out > /sys/class/gpio/gpio${FAN_GPIO}/direction
echo -n 1 > /sys/class/gpio/gpio${FAN_GPIO}/value
}

setup_pwm() {
  IFS=','
  read PWM_CHIP PWM_NUM <<< ${PWM}
  if ! [[ -d /sys/class/pwm/pwmchip${PWM_CHIP}/pwm${PWM_NUM} ]]; then
	  echo -n ${PWM_NUM} > /sys/class/pwm/pwmchip${PWM_CHIP}/export
  fi

  
  read -ra TEMPS <<< ${PWM_TEMPS}
  read -ra DUTY <<< ${PWM_DUTY}
  export TEMPS
  export DUTY
  export PWM_PATH=/sys/class/pwm/pwmchip${PWM_CHIP}/pwm${PWM_NUM}

  if [[ $(cat ${PWM_PATH}/enable) -eq 1 ]];then
	  echo -n 0 > ${PWM_PATH}/enable
  fi
  echo -n ${PWM_PERIOD} > ${PWM_PATH}/period
  echo -n ${DUTY[0]} > ${PWM_PATH}/duty_cycle
  echo -n 1 > ${PWM_PATH}/enable
}

if [[ -z ${PWM} ]]; then
    echo "Setting up GPIO mode"
    setup_gpio
else
    echo "Setting up PWM mode"
	setup_pwm
fi

regulate_gpio() {
	TEMP=$1

	if [[ ${TEMP} -ge ${THERMAL_HIGH} ]];then
       echo -n 1 > /sys/class/gpio/gpio${FAN_GPIO}/value
	elif [[ ${TEMP} -le ${THERMAL_LOW} ]];then
       echo -n 0 > /sys/class/gpio/gpio${FAN_GPIO}/value
	fi
}

regulate_pwm() {
    TEMP=$1
    
	# First, look for saturations
	if [[ ${TEMP} -le ${TEMPS[0]}000 ]];then
		echo -n ${DUTY[0]} > ${PWM_PATH}/duty_cycle
		return
	elif [[ ${TEMP} -ge ${TEMPS[-1]}000 ]];then
		echo -n ${DUTY[-1]} > ${PWM_PATH}/duty_cycle
		return
	fi

	# Otherwise, regulate
	for t in ${!TEMPS[@]}; do
		if [[ ${TEMP} -le ${TEMPS[$t]}000 ]]; then
			RATIO=$(( ($TEMP - ${TEMPS[$(($t - 1))]}000) * 1000 /(${TEMPS[$t]}000 - ${TEMPS[$(($t - 1))]}000) ))
			DC=$((${DUTY[$(($t - 1))]} + (${DUTY[$t]} - ${DUTY[$(($t - 1))]} ) * $RATIO / 1000 ))
			if ! [[ -z ${DEBUG} ]];then
			   echo "Temp ${TEMP}, Ratio ${RATIO}, Duty ${DC}"
			fi
			echo -n ${DC} > ${PWM_PATH}/duty_cycle
			return
		fi
	done
}

while :; do
	TEMP=$(cat ${THERMAL_ZONE}) || exit 1
    if [[ -z ${PWM} ]];then
		regulate_gpio $TEMP
	else
		regulate_pwm $TEMP
	fi
	sleep ${REFRESH_DELAY}
done
