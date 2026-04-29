#!/usr/bin/env bash
declare -r script="$0"
declare -r dir="${script%/*}"
find "$dir" -type f -executable -not -name '*.sh' -exec cp --link --update=all {} .git/hooks/  \; -print
