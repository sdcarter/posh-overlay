# Change: Fuel Indicator Position and Label

Two changes to the fuel laps remaining indicator in the ribbon:

1. Remove the `F` suffix — display `9.4` not `9.4F`
2. Move the fuel indicator to render AFTER the other ribbon items (incidents, BB, TC, ABS) instead of before them. Currently the fuel block renders first in the ribbon div, then lowerItems. Swap the order so lowerItems render first, then the fuel block last.
