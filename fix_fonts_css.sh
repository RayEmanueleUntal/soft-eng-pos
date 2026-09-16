#!/bin/bash
sed -i '' 's/--font-sans: var(--font-sans);/--font-sans: var(--font-inter);/g' app/globals.css
sed -i '' 's/--font-mono: var(--font-geist-mono);/--font-mono: var(--font-jetbrains-mono);/g' app/globals.css
sed -i '' 's/--font-heading: var(--font-sans);/--font-heading: var(--font-space-grotesk);/g' app/globals.css
