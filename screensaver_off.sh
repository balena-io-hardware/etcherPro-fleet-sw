#!/bin/bash

if [ ! -d /sys/class/gpio/gpio101 ]; then echo 101 > /sys/class/gpio/export; fi
if [ -d /sys/class/gpio/gpio101 ]; then echo 1 > /sys/class/gpio/gpio101/value; fi
if [ ! -d /sys/class/gpio/gpio131 ]; then echo 131 > /sys/class/gpio/export; fi
if [ -d /sys/class/gpio/gpio131 ]; then echo 0 > /sys/class/gpio/gpio131/value; fi
if [ -d /sys/class/pwm/pwmchip2/pwm0 ]; then echo 1 > /sys/class/pwm/pwmchip2/pwm0/enable; fi
echo 1 > /sys/devices/system/cpu/cpu1/online
echo 1 > /sys/devices/system/cpu/cpu2/online
echo 1 > /sys/devices/system/cpu/cpu3/online
dbus-send --system --dest=org.freedesktop.systemd1 --type=method_call --print-reply /org/freedesktop/systemd1 org.freedesktop.systemd1.Manager.StartUnit string:gov-switch.service string:replace
dbus-send --system --dest=org.freedesktop.systemd1 --type=method_call --print-reply /org/freedesktop/systemd1 org.freedesktop.systemd1.Manager.StartUnit string:fan-control.service string:replace 
