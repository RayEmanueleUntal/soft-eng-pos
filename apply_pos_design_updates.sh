#!/usr/bin/env bash

# Exit on error
set -e

echo "=========================================================="
echo "  Applying Updated Industrial Hardware POS Design Tokens  "
echo "=========================================================="

# Target directories containing React/Next.js components
TARGET_DIRS=("app" "components" "src")

# Determine OS for sed in-place flag
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_I=(-i '')
else
  SED_I=(-i)
fi

for DIR in "${TARGET_DIRS[@]}"; do
  if [ -d "$DIR" ]; then
    echo "Processing directory: $DIR..."

    # ---------------------------------------------------------
    # 1. SPACING & DENSITY (Prevents cascading overwrites)
    # ---------------------------------------------------------
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bp-3\b/__P_TEMP_2_5__/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bgap-3\b/__GAP_TEMP_2_5__/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bp-4\b/p-3/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bgap-4\b/gap-3/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bm-4\b/m-3/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/__P_TEMP_2_5__/p-2.5/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/__GAP_TEMP_2_5__/gap-2.5/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bgap-1\b/gap-0.5/g' {} +

    # ---------------------------------------------------------
    # 2. HEIGHT STANDARDIZATION
    # ---------------------------------------------------------
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bh-12\b/__H_TEMP_9__/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bh-16\b/h-12/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bh-14\b/h-10/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/__H_TEMP_9__/h-9/g' {} +

    # ---------------------------------------------------------
    # 3. COLOR & BRAND SURFACES
    # ---------------------------------------------------------
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bbg-slate-50\b/bg-[#f8f9ff]/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bbg-blue-50\b/bg-[#eff4ff]/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bbg-slate-100\b/bg-[#eff4ff]/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bbg-blue-600\b/bg-[#0060b2]/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\btext-blue-600\b/text-[#0060b2]/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bborder-slate-200\b/border-[#e2e8f0]/g' {} +
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/\bborder-gray-300\b/border-[#c1c6d3]/g' {} +

    # ---------------------------------------------------------
    # 4. TYPOGRAPHY & TABULAR DATA
    # ---------------------------------------------------------
    find "$DIR" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed "${SED_I[@]}" 's/font-semibold tabular-nums/font-mono font-medium/g' {} +

  fi
done

echo "=========================================================="
echo "  Done! POS design updates successfully applied.          "
echo "=========================================================="