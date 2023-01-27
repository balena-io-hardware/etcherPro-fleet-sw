#!/bin/ash

DEVICE=/dev/zram0
ZRAM_SIZE=${ZRAM_SIZE:=1G}

if ! zramctl $DEVICE; then
        exit
fi

CURRENT_SIZE=$(zramctl --raw --noheadings --output DISKSIZE $DEVICE)

if [ $CURRENT_SIZE != $ZRAM_SIZE ]; then
	swapoff $DEVICE
	zramctl $DEVICE --algorithm lz4 --size $ZRAM_SIZE
	mkswap $DEVICE
	swapon $DEVICE
fi
