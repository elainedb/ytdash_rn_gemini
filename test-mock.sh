#!/bin/bash
adb -s 25251FDF60029V reverse tcp:8091 tcp:8091
ARGS=(
  -e APP_ID=com.example.ytdash_rn
  -e MOCK_API_BASE=http://127.0.0.1:8091
  -e AUTHORIZED_EMAIL=elaine.batista1105@gmail.com
  -e UNAUTHORIZED_EMAIL=unauthorized@example.com
)

maestro --device 25251FDF60029V test "${ARGS[@]}" flows/AC-LOGIN-01.yaml
