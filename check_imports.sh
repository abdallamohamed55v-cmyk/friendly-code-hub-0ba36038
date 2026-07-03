while read file; do
  # Get the base name without extension
  base=$(basename "$file" | sed 's/\.tsx$//; s/\.ts$//')
  
  # If it's index.tsx or index.ts, check the parent directory name instead
  if [ "$base" = "index" ]; then
    base=$(basename "$(dirname "$file")")
  fi

  # Search for the base name in src/ (excluding the file itself)
  # We look for "from './base" or "from '@/.../base" or "import './base"
  # Also handle cases where it might be imported via index files
  count=$(rg -l -w "$base" src/ | grep -v "$file" | wc -l)
  
  if [ "$count" -eq 0 ]; then
    echo "UNUSED: $file"
  fi
done < all_files.txt
