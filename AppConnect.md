npx expo run:ios

I'll quickly inspect your Expo config and EAS settings so the steps match your project exactly, then outline the exact commands and Xcode/App Store Connect steps.

[5 tools called]

I took a quick look at your Expo/EAS config and iOS project so the steps below match your setup.

### Pre-flight checklist (do once)
- Bundle identifier: pick one and use it everywhere.
  - `app.config.js` has `ios.bundleIdentifier` set to `com.tg.gestalts`.
  - Your App Store app (ascAppId 6761716778) may be using `com.tgsatwit.gestalts`.
  - Make them match (prefer the one in App Store Connect). Update `ios.bundleIdentifier` in `gestalts/app.config.js` if needed.
- Secrets: remove hardcoded API keys from `gestalts/app.json` and rely on `app.config.js` env vars.
  - Set them in EAS: ELEVENLABS_API_KEY, LANGUAGE_COACH_AGENT_ID, PARENT_SUPPORT_AGENT_ID, CHILD_MODE_AGENT_ID, GEMINI_API_KEY, FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID.
- Versioning:
  - Marketing version: `expo.version` in `app.config.js` (currently 1.0.0).
  - Build number auto-increments on iOS via EAS (`autoIncrement: true`).
- Background modes: you have `audio` and `voip` in `Info.plist`. If you’re not using PushKit VoIP, remove `voip` to avoid review flags.

### Fast path: EAS Build + Submit (recommended)
From `/Users/timgillam/projects/Gestalts-mobile/gestalts`:
1) Login
- `npm i -g eas-cli`
- `eas login`
- `eas whoami`

2) Set secrets (example)
- `eas secret:push --scope project`
- `eas secret:set --scope project --name ELEVENLABS_API_KEY --value "..."` 
- Repeat for the rest of the keys referenced in `app.config.js`.

3) Build iOS Release
- `eas build --platform ios --profile production`
  - Choose “Let EAS handle credentials” when prompted; Team ID is `4JV3RGXM7D`.

4) Auto-submit to TestFlight (optional single step)
- `eas build --platform ios --profile production --auto-submit`
  - Uses `eas.json` submit config (appleId, ascAppId, appleTeamId).

5) Submit latest build (if not auto-submitting)
- `eas submit -p ios --profile production --latest`

Processing takes ~15–60 minutes.

### If you prefer Xcode (manual path)
1) Open `gestalts/ios/gestalts.xcworkspace` in Xcode.
2) Targets › gestalts:
   - Signing & Capabilities: select Team `4JV3RGXM7D`, set Bundle Identifier to match App Store Connect.
   - Set Build Configuration to Release, Any iOS Device (arm64).
3) Product › Archive, then Distribute App › App Store Connect › Upload.
4) Complete export compliance (see below), then wait for processing.

### TestFlight setup
- In App Store Connect, open your app, go to TestFlight.
- Create an internal testing group; add testers (Users and Access › Sandbox/Testers).
- Answer export compliance:
  - “Does your app use encryption?”: Yes.
  - “Is it exempt?”: Typically “Uses standard encryption” (HTTPS/OS libraries only), not custom crypto.
- App Privacy: ensure data types are set; ATT if applicable (likely not).

### Common issues to avoid
- Mismatched bundle identifiers between Xcode, `app.config.js`, and the App Store app.
- Hardcoded secrets in `gestalts/app.json`. Remove them and use EAS secrets.
- `voip` background mode if you’re not using PushKit.

If you want, I can align the bundle identifier and strip secrets from `gestalts/app.json`, then kick off an EAS build for you. 

- I inspected your config and verified EAS is set up with project ID and submit info. If you want, I’ll normalize the bundle ID and remove secrets next, then run the production build.
- Summary:
  - Use EAS: set secrets, run `eas build --platform ios --profile production` and `eas submit ...`.
  - Ensure bundle identifier matches App Store Connect.
  - Remove secrets from `gestalts/app.json`; rely on env in `app.config.js`.

cd /Users/timgillam/projects/Gestalts-mobile/gestalts/ios
open gestalts.xcworkspace

   cd ios
   rm -rf build/
   pod install

      npx expo start --clear