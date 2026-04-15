# CreatorHub — Run Commands

Open **3 separate terminal tabs** and run each in order.

---

## Tab 1: Firebase Auth Emulator

```bash
cd /Users/rohit/Downloads/2_Project/startup_Idea/creatorhub
firebase emulators:start --only auth
```

Wait until you see: `Auth Emulator running on localhost:9099`

---

## Tab 2: API Server

```bash
cd /Users/rohit/Downloads/2_Project/startup_Idea/creatorhub/apps/api
pnpm dev
```

Wait until you see: `Server running on port 3001`

---

## Tab 3: Flutter App (iOS Simulator)

```bash
cd /Users/rohit/Downloads/2_Project/startup_Idea/creatorhub/apps/mobile
flutter run -d D42232F9-A0EB-432C-B44E-B41930E48E12
```

---

## Kill All Ports

```bash
lsof -i :3001 -i :9099 -t | xargs kill 2>/dev/null
```

---

## OTP Testing (Debug Mode)

When using the Auth Emulator, the verification code is printed in the Flutter debug console:

```
[Auth Emulator] OTP for +91XXXXXXXXXX: 123456
```

You can also check all pending codes at: `http://localhost:9099`

---

## Quick Reference

| Service            | Port | Command                          |
|--------------------|------|----------------------------------|
| Firebase Auth Emu  | 9099 | `firebase emulators:start --only auth` |
| API Server         | 3001 | `pnpm dev` (in `apps/api/`)     |
| Flutter App        | —    | `flutter run -d <simulator-id>` |

## Find Simulator ID

```bash
xcrun simctl list devices booted
```
