#!/usr/bin/env bash
set -euo pipefail
api="$1"
mkdir -p runtime-results
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell dumpsys deviceidle disable
if [ "$api" -ge 33 ]; then
  adb shell am instrument -w -e phase denied app.patchwork.radar.beta.test/app.patchwork.radar.ReminderInstrumentation | tee runtime-results/permission-denied.txt
  grep -q '"ok":true' runtime-results/permission-denied.txt
  adb shell pm grant app.patchwork.radar.beta android.permission.POST_NOTIFICATIONS
fi
if [ "$api" -ge 31 ]; then
  adb shell appops set app.patchwork.radar.beta SCHEDULE_EXACT_ALARM allow
fi
adb shell am instrument -w -e phase granted app.patchwork.radar.beta.test/app.patchwork.radar.ReminderInstrumentation | tee runtime-results/notification-delivery.txt
grep -q '"ok":true' runtime-results/notification-delivery.txt

adb exec-out run-as app.patchwork.radar.beta cat files/widget-light.png > runtime-results/widget-light.png
adb exec-out run-as app.patchwork.radar.beta cat files/widget-dark.png > runtime-results/widget-dark.png
