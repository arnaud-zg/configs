#!/bin/sh
# Enforces Conventional Commits: type(scope): [optional-tag] description
set -eu

msg_file="$1"
subject=$(head -n1 "$msg_file")

case "$subject" in
  "Merge "*|"Revert "*|"fixup! "*|"squash! "*)
    exit 0
    ;;
esac

pattern='^(feat|fix|test|refactor|chore|docs|perf)\([a-z0-9-]+\)!?: (\[[A-Za-z0-9.-]+\] )?.+'
if ! echo "$subject" | grep -qE "$pattern"; then
  echo "Commit message does not match 'type(scope): [optional-tag] description'"
  echo "  got: $subject"
  echo "  types: feat fix test refactor chore docs perf"
  exit 1
fi
