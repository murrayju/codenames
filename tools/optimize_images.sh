#!/bin/bash

# Set the desired width and quality for the WebP images
TARGET_WIDTH=325
TARGET_QUALITY=85

# Exit script if any command fails
set -e

# Check if the source and destination directories exist
if [ ! -d "$1" ] || [ ! -d "$2" ]; then
  echo "Usage: $0 <source_directory> <destination_directory>"
  exit 1
fi

# Get the absolute path of the directories
SOURCE_DIR=$(readlink -f "$1")
DEST_DIR=$(readlink -f "$2")

# Print info
echo "Converting PNG files to WebP in ${SOURCE_DIR} and saving to ${DEST_DIR}"
echo "with width ${TARGET_WIDTH} px and quality ${TARGET_QUALITY}%"

# Iterate through each PNG file in the source directory
for file in "${SOURCE_DIR}"/*.png; do
  # Get the file name without extension
  filename=$(basename -- "${file%.*}")

  # Convert and resize the PNG file to WebP
  convert "${file}" -resize "${TARGET_WIDTH}"x -quality "${TARGET_QUALITY}" "${DEST_DIR}/${filename}.webp"
done

echo "Conversion and optimization completed successfully."

