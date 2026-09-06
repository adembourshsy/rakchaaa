# RAKCHA GAME — Mobile (Capacitor) build guide

The React + Vite web app is unchanged and remains the single source of truth.
Capacitor wraps the production Vite output (`dist`) into native Android and iOS apps.

## Identity

- App name: **RAKCHA GAME**
- Bundle / application ID (both platforms, permanent): **com.antifada.app**
- Capacitor `webDir`: `dist`
- Firebase project: **tawla-e6f71** (unchanged; web config still comes from `VITE_FIREBASE_*` env vars)

## Commands

```bash
npm install
cp .env.example .env.local   # fill in the Firebase web config
npm run dev                  # web dev server
npm run build                # Vite production build -> dist/
npx cap sync                 # copy dist/ + plugins into android/ and ios/
npm run android              # build + sync + open Android Studio
npm run ios                  # build + sync + open Xcode
```

## Android release

1. `npm run sync`
2. Open `android/` in Android Studio.
3. `Build > Generate Signed Bundle / APK` (AAB for Play Store, APK for direct install).
4. Version: `android/app/build.gradle` -> `versionCode` / `versionName`.
5. Signing keys/keystores are intentionally **not** included in this repository and are gitignored.

## iOS release

1. `npm run sync`
2. `cd ios/App && pod install` (macOS only), then open `App.xcworkspace` in Xcode.
3. Set your Apple team, then Archive -> Distribute to TestFlight / App Store.
4. Version: Xcode target -> `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`.
5. Certificates and provisioning profiles are intentionally **not** included and are gitignored.

## Mobile-specific code

- `capacitor.config.ts` — app id/name, `webDir: dist`, SplashScreen / StatusBar / Keyboard config.
- `src/native/nativeShell.ts` — status bar, splash hide, keyboard resize + keyboard-height CSS var,
  external `http(s)` links opened in the system browser.
- `src/native/useAndroidBackButton.ts` — Android back button mapped to in-app navigation.
- `src/index.css` (bottom block) — WebView-only fixes: no rubber-band overscroll, no long-press
  callouts, keyboard padding. Safe areas were already handled by `MobileContainer`.
- `index.html` — `viewport-fit=cover` + theme color for notch/cutout devices.
- `resources/` — source icon & splash used by `@capacitor/assets`.

No visual redesign was made; all changes above are technical mobile compatibility only.
