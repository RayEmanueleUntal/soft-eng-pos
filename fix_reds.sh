#!/bin/bash
find app components -type f -name "*.tsx" -exec sed -i '' \
  -e 's/text-red-700/text-destructive/g' \
  -e 's/text-red-600/text-destructive/g' \
  -e 's/text-red-500/text-destructive/g' \
  -e 's/bg-red-50\/70/bg-destructive\/10/g' \
  -e 's/bg-red-50/bg-destructive\/10/g' \
  -e 's/bg-red-100\/60/bg-destructive\/10/g' \
  -e 's/bg-red-100/bg-destructive\/20/g' \
  -e 's/border-red-200/border-destructive\/30/g' \
  {} +
