#!/usr/bin/env bash

set -u -e -o pipefail

TEST=false
for ARG in "$@"; do
  case "$ARG" in
    -t)
      TEST=true
      ;;
  esac
done

$(npm bin)/tsc

cp LICENSE dist/LICENSE
cp package.json dist/package.json
cp README.md dist/README.md

# if [[ ${TEST} == true ]]; then
#   cp -fr dist/* ../vscode-snippet-generator-tpl/node_modules/vscode-snippet-generator
# fi