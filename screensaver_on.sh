#!/bin/bash

if [ ! -d /sys/class/gpio/gpio101 ]; then echo 101 > /sys/class/gpio/export; fi
if [ -d /sys/class/gpio/gpio101 ]; then echo 0 > /sys/class/gpio/gpio101/value; fi
if [ ! -d /sys/class/gpio/gpio131 ]; then echo 131 > /sys/class/gpio/export; fi
if [ -d /sys/class/gpio/gpio131 ]; then echo 1 > /sys/class/gpio/gpio131/value; fi
if [ -d /sys/class/pwm/pwmchip2/pwm0 ]; then echo 0 > /sys/class/pwm/pwmchip2/pwm0/enable; fi
dbus-send --system --dest=org.freedesktop.systemd1 --type=method_call --print-reply /org/freedesktop/systemd1 org.freedesktop.systemd1.Manager.StopUnit string:gov-switch.service string:replace
echo userspace > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
echo powersave > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
dbus-send --system --dest=org.freedesktop.systemd1 --type=method_call --print-reply /org/freedesktop/systemd1 org.freedesktop.systemd1.Manager.StopUnit string:fan-control.service string:replace
for i in $(seq 1 -1 0); do
	if [ ! -d /sys/class/pwm/pwmchip1/pwm0 ]; then
		echo 0 > /sys/class/pwm/pwmchip1/export;
	fi
	if [ -d /sys/class/pwm/pwmchip1/pwm0 ]; then
		echo 45000 > /sys/class/pwm/pwmchip1/pwm0/period
		echo 45000 > /sys/class/pwm/pwmchip1/pwm0/duty_cycle;
	fi
	sleep 60;
done
if [ ! -d /sys/class/pwm/pwmchip1/pwm0 ]; then echo 0 > /sys/class/pwm/pwmchip1/export; fi
if [ -d /sys/class/pwm/pwmchip1/pwm0 ]; then echo 0 > /sys/class/pwm/pwmchip1/pwm0/duty_cycle && echo 1 > /sys/class/pwm/pwmchip1/pwm0/period; fi
clicklock
