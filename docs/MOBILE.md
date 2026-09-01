# Building the mobile app (iOS / Android)

SAATH ships in two flavors from the same codebase:

| | **Self-hosted** (this repo's default) | **Connected mobile app** (`VITE_MOBILE=1`, `VITE_MOBILE_SYNC=1`) |
|---|---|---|
| Runs | in any browser, against your own server | natively on iPhone / Android (Capacitor shell) |
| Accounts | administrator-created accounts, one profile per person | same Oracle-hosted account and administrator controls |
| Data | synced to your server, readable on desktop | synced to the server and mirrored in the app's private storage |
| Reminders | Web Push from your server | native local notifications |
| Exercise media | served by your server (`img/`, `gif/`) | loaded from the jsDelivr CDN |

The connected mobile flavor uses the same login and data API as the Oracle-hosted app. State is
mirrored from `localStorage` into `SAATH-state.json` in the app's private data directory on every
change, then synchronized after changes, on launch, and whenever the app returns to the foreground.
The file mirror lets the app keep working while offline; it is reconciled with the server when a
connection returns. Backups go out through the OS share sheet instead of a browser download.

## Prerequisites

- Node 20+
- **Android:** Android Studio with SDK platform 35/build-tools installed. Java 21 for Gradle.
- **iOS:** a Mac with Xcode 15+ and CocoaPods (`brew install cocoapods`). A free Apple ID
  is enough to run the app on your own iPhone (see below); paid membership is only needed
  for App Store distribution, which SAATH doesn't do.

## Build & run

```sh
cd frontend
npm install
$env:VITE_MOBILE = '1'
$env:VITE_MOBILE_SYNC = '1'
$env:VITE_API_BASE = 'https://saath.example.com'
$env:VITE_IMG_BASE = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/images/'
$env:VITE_GIF_BASE = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/videos/'
npm run build
npx cap sync

npx cap open android        # opens Android Studio → run on emulator or device
npx cap open ios            # opens Xcode (Mac only) → set your signing team, then run
```

The mobile build bakes the Oracle API URL and CDN media bases into the bundle, then copies the web
build into both native projects. Re-run it after every web-code change before building natively.

For GitHub Actions, set the repository variable `SAATH_ORIGIN` to the Oracle HTTPS URL. The Android
workflow refuses to build a connected APK if that variable is missing.

> **Heads-up:** after `build:mobile`, `frontend/dist` contains the *mobile* bundle.
> Run a plain `npm run build` again before deploying `dist` to a server.

## App icons & splash screens

`frontend/resources/icon.svg` is the 1024×1024 SAATH mark (two connected paths on the
navy field `#071525`). Generate all platform assets from it on a machine with the tooling:

```sh
cd frontend
npx @capacitor/assets generate --iconBackgroundColor '#071525' --splashBackgroundColor '#071525'
```

(If the generator won't take the SVG directly, export it to `resources/icon.png` at
1024×1024 first — any image tool can do it.)

## Distribution — deliberately no app stores

SAATH's mobile app is not on the Play Store or App Store, and that's a choice: no store
accounts, no store rules, no yearly fees between you and an open-source app.

### Android — sideload the APK

This repository does not promise a public signed APK. Build and sign an APK for your own devices.

To build and sign your own:

```sh
cd frontend && npm run build:mobile
cd android && ./gradlew assembleRelease            # → app/build/outputs/apk/release/app-release-unsigned.apk

# one-time: create a keystore. KEEP IT — updates must be signed with the same key,
# or Android refuses to install the new version over the old one.
keytool -genkeypair -keystore my.keystore -alias SAATH -keyalg RSA -validity 10950

# align + sign (zipalign/apksigner ship with the Android SDK build-tools)
zipalign -f -p 4 app-release-unsigned.apk aligned.apk
apksigner sign --ks my.keystore --ks-key-alias SAATH --out SAATH.apk aligned.apk
```

### iPhone — what's actually possible

Apple does not allow installing apps outside the App Store, so there is no `.ipa` download
that would simply install. Your free options:

- **Self-host + PWA** (recommended): open your instance in Safari → Share → *Add to Home
  Screen*. Full-screen app, no expiry, plus server-backed family accounts and sync.
- **Xcode free signing:** open `ios/` in Xcode with a free Apple ID as the team and run it
  onto your own iPhone. Apple expires the signature after 7 days; re-run from Xcode to renew.
- **AltStore:** automates that 7-day re-signing over Wi-Fi via a Mac companion app.

### Release notes for maintainers

- Bump `versionName`/`versionCode` in `android/app/build.gradle` per release; keep them in
  step with `frontend/package.json`. `versionCode` must strictly increase or updates won't
  install over an existing APK.
- **License:** SAATH is AGPL-3.0, which by itself sits badly with app-store terms of
  service. `NOTICE.md` carries an app-store exception (an additional permission under
  AGPL §7) granted by the copyright holder — relevant only if store distribution ever happens.
- The app requests notification permission only when the workout-day reminder is switched
  on, and (on Android) declares `SCHEDULE_EXACT_ALARM` so the reminder fires to the minute
  where the user allows it.
