#!/bin/sh
node bin/json-exchange.js -f 'examples/output.json' -t 'examples/input.json' -m 'keysets.*.keys.*.translations.ru' -r '\.ru$' -l '.en' -o 'examples/result.json'
