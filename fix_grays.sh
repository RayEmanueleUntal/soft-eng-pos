#!/bin/bash
find app components -type f -name "*.tsx" -exec sed -i '' \
  -e 's/text-gray-900/text-foreground/g' \
  -e 's/text-gray-800/text-foreground/g' \
  -e 's/text-gray-700/text-foreground/g' \
  -e 's/text-gray-600/text-muted-foreground/g' \
  -e 's/text-gray-500/text-muted-foreground/g' \
  -e 's/text-gray-400/text-muted-foreground\/80/g' \
  -e 's/text-gray-300/text-muted-foreground\/60/g' \
  -e 's/bg-gray-50/bg-muted/g' \
  -e 's/bg-gray-100/bg-accent/g' \
  -e 's/bg-gray-200/bg-accent/g' \
  -e 's/bg-gray-300/bg-border/g' \
  -e 's/bg-gray-900/bg-foreground/g' \
  -e 's/border-gray-200/border-border/g' \
  -e 's/border-gray-300/border-border/g' \
  -e 's/border-gray-100/border-border\/50/g' \
  -e 's/border-gray-400/border-muted-foreground/g' \
  -e 's/bg-white/bg-card/g' \
  {} +
