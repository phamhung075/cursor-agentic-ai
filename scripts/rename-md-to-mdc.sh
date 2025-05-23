#!/bin/bash

# Check if a directory argument is passed
if [ -z "$1" ]; then
  echo "Usage: $0 <folder-path>"
  exit 1
fi

FOLDER="$1"

# Check if the folder exists
if [ ! -d "$FOLDER" ]; then
  echo "Error: '$FOLDER' is not a valid directory."
  exit 1
fi

# Recursively rename .mdc files to .mdcc
find "$FOLDER" -type f -name "*.mdc" | while read -r FILE; do
  NEWFILE="${FILE%.mdc}.mdcc"
  mv "$FILE" "$NEWFILE"
  echo "Renamed: $FILE -> $NEWFILE"
done

echo "✅ All .mdc files renamed to .mdcc (including subfolders)."
