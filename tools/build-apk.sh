#!/usr/bin/env bash
# Builds a small Android app (APK) that opens the live game full-screen.
# The app is a shell around the website, so the game updates itself: you only reinstall the APK if the shell changes.
# Needs: Node 20, JDK 17, the Android SDK (all present on GitHub's ubuntu runners).
#   SITE_URL  the address the app opens      APP_ID  Android package name      APP_NAME  label under the icon
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE_URL="${SITE_URL:-https://eternal-realms-26r.pages.dev}"; APP_ID="${APP_ID:-com.eternalrealms.game}"; APP_NAME="${APP_NAME:-Eternal Realms}"
VERSION_CODE="${VERSION_CODE:-1}"; VERSION_NAME="${VERSION_NAME:-1.0.$VERSION_CODE}"
W="$(mktemp -d)"; cd "$W"
npm init -y >/dev/null
npm install --silent --no-audit --no-fund @capacitor/core@6 @capacitor/cli@6 @capacitor/android@6
mkdir www
# shown only if the phone is offline when the app opens
cat > www/index.html <<HTML
<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<body style="margin:0;height:100vh;display:grid;place-items:center;background:#2a3a5a;color:#ffe08a;font-family:serif;text-align:center">
<div><h1 style="letter-spacing:.1em">Eternal Realms</h1><p style="color:#b9b2a0">The Realms can't be reached.<br>Check your connection.</p>
<button onclick="location.href='$SITE_URL'" style="font:inherit;padding:.7em 1.6em;background:#2a2418;color:#e0b45e;border:1px solid #8a7030;border-radius:8px">Try again</button></div></body>
HTML
cp www/index.html www/offline.html
cat > capacitor.config.json <<JSON
{"appId":"$APP_ID","appName":"$APP_NAME","webDir":"www","backgroundColor":"#0b0d12",
 "server":{"url":"$SITE_URL","androidScheme":"https","errorPath":"offline.html"}}
JSON
npx cap add android >/dev/null
# our icon instead of the default one (drop the adaptive-icon XML so the PNGs are used)
rm -rf android/app/src/main/res/mipmap-anydpi-v26
cp -r "$ROOT/tools/android/res/." android/app/src/main/res/
for d in android/app/src/main/res/mipmap-*; do rm -f "$d/ic_launcher_foreground.png"; done
# portrait only, version from the build number
sed -i "s/versionCode 1/versionCode $VERSION_CODE/; s/versionName \"1.0\"/versionName \"$VERSION_NAME\"/" android/app/build.gradle
npx cap sync android >/dev/null
( cd android && chmod +x gradlew && ./gradlew assembleDebug --no-daemon -q )
OUT="$ROOT/${OUT_DIR:-game}"; mkdir -p "$OUT"
cp android/app/build/outputs/apk/debug/app-debug.apk "$OUT/eternal-realms.apk"
ls -la "$OUT/eternal-realms.apk"
