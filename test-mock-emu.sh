#!/bin/bash
adb -s emulator-5554 reverse tcp:8091 tcp:8091
adb -s emulator-5554 install -r android/app/build/outputs/apk/release/app-release.apk

ARGS=(
  -e APP_ID=com.example.ytdash_rn
  -e MOCK_API_BASE=http://127.0.0.1:8091
  -e AUTHORIZED_EMAIL=elaine.batista1105@gmail.com
  -e UNAUTHORIZED_EMAIL=unauthorized@example.com
)

maestro --device emulator-5554 test "${ARGS[@]}" flows/AC-LOGIN-01.yaml
