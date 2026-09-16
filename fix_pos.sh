#!/bin/bash
sed -i '' 's/bg-\[#F8FAFC\]/bg-background/g' app/dashboard/pos/page.tsx
sed -i '' 's/bg-\[#0060B2\]/bg-primary/g' app/dashboard/pos/page.tsx
sed -i '' 's/text-\[#0060B2\]/text-primary/g' app/dashboard/pos/page.tsx
sed -i '' 's/border-\[#0060B2\]/border-primary/g' app/dashboard/pos/page.tsx
sed -i '' 's/text-\[#0F172A\]/text-foreground/g' app/dashboard/pos/page.tsx
sed -i '' 's/bg-\[#F1F5F9\]/bg-muted/g' app/dashboard/pos/page.tsx
sed -i '' 's/bg-\[#E2E8F0\]/bg-muted\/80/g' app/dashboard/pos/page.tsx
sed -i '' 's/text-\[#475569\]/text-muted-foreground/g' app/dashboard/pos/page.tsx
sed -i '' 's/border-\[#E2E8F0\]/border-border/g' app/dashboard/pos/page.tsx
sed -i '' 's/border-\[#CBD5E1\]/border-input/g' app/dashboard/pos/page.tsx
sed -i '' 's/hover:bg-\[#004888\]/hover:bg-primary\/80/g' app/dashboard/pos/page.tsx
sed -i '' 's/hover:border-\[#0060B2\]/hover:border-primary/g' app/dashboard/pos/page.tsx
sed -i '' 's/hover:border-l-\[#0060B2\]/hover:border-l-primary/g' app/dashboard/pos/page.tsx
sed -i '' 's/hover:bg-\[#E0F2FE\]/hover:bg-accent/g' app/dashboard/pos/page.tsx
sed -i '' 's/bg-\[#0F172A\]/bg-secondary-foreground/g' app/dashboard/pos/page.tsx
sed -i '' "s/ style={{ fontFamily: 'Space Grotesk, sans-serif' }}//g" app/dashboard/pos/page.tsx
sed -i '' 's/font-\[700\]/font-bold/g' app/dashboard/pos/page.tsx
