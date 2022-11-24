### Test suite for EtcherPro device

Ensure that:

1. device turns on (LCD is on, fan is on)
2. device boots (displays Etcher UI)

Repeat 3,4,5 for USB drive, microSD card, SD card:

3. can flash 16 destinations from URL
4. can clone 1 source into 15 destinations
5. can flash 15 destinations from file on one source

for each of 3,4,5, check if LEDs work correctly.

6. Device is usable after a catastrophic failure (power off during flashing)
7. Can connect to wifi
8. Can put screen to sleep/wake up using a dedicated button
9. Shows version information in settings.
