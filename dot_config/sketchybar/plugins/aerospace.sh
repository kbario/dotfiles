#!/usr/bin/env bash

# make sure it's executable with:
# chmod +x ~/.config/sketchybar/plugins/aerospace.sh

if [ "$1" = "$FOCUSED_WORKSPACE" ]; then
  sketchybar --set "$NAME" label.highlight=on
  echo "asdf"
else
  sketchybar --set "$NAME" label.highlight=off
fi

sketchybar --set "$NAME" label.highlight="$SELECTED"
