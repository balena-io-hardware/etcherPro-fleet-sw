#!/bin/bash

if [ ! -d /sys/class/gpio/gpio101 ]; then echo 101 > /sys/class/gpio/export; fi
if [ -d /sys/class/gpio/gpio101 ]; then echo 0 > /sys/class/gpio/gpio101/value; fi
if [ ! -d /sys/class/gpio/gpio131 ]; then echo 131 > /sys/class/gpio/export; fi
if [ -d /sys/class/gpio/gpio131 ]; then echo 1 > /sys/class/gpio/gpio131/value; fi
if [ -d /sys/class/pwm/pwmchip1/pwm0 ]; then echo 0 > /sys/class/pwm/pwmchip1/pwm0/enable; fi
dbus-send --system --dest=org.freedesktop.systemd1 --type=method_call --print-reply /org/freedesktop/systemd1 org.freedesktop.systemd1.Manager.StopUnit string:gov-switch.service string:replace
echo powersave > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
