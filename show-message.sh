#!/bin/bash

# Simple message display script that bypasses Cursor task detection
# Usage: ./show-message.sh "your message"

if [ $# -eq 0 ]; then
    printf "Usage: ./show-message.sh \"your message\"\n"
    exit 1
fi

# Use printf to output the message
printf "%s\n" "$*" 