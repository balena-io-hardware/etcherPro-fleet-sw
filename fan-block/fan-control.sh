#!/bin/sh

# Exits on failure
set -e

# Get environment variables, set default values to match etcherPro
FAN_GPIO=${FAN_GPIO:-132}
THERMAL_ZONE=/sys/class/thermal/thermal_zone${THERMAL_ZONE:-0}/temp
THERMAL_HIGH=${THERMAL_HIGH:-60}000
THERMAL_LOW=${THERMAL_LOW:-40}000
REFRESH_DELAY=${REFRESH_DELAY:-60}

# First, set GPIO as output
if [[ -d /sys/class/gpio/gpio${FAN_GPIO} ]]; then
   echo ${FAN_GPIO} > /sys/class/gpio/unexport
fi

echo ${FAN_GPIO} > /sys/class/gpio/export
echo out > /sys/class/gpio/gpio${FAN_GPIO}/direction
echo 1 > /sys/class/gpio/gpio${FAN_GPIO}/value


while :; do
	TEMP=$(cat ${THERMAL_ZONE}) || exit 1
	
	if [[ ${TEMP} -ge ${THERMAL_HIGH} ]];then
       echo 1 > /sys/class/gpio/gpio${FAN_GPIO}/value
	elif [[ ${TEMP} -le ${THERMAL_LOW} ]];then
       echo 0 > /sys/class/gpio/gpio${FAN_GPIO}/value
	fi

	sleep ${REFRESH_DELAY}
done
