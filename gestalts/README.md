# Gestalts (Mobile)

A mobile app for parents of children who are Gestalt Language Processors (GLP). It focuses on:

- AI Coach with three modes: Language Coach, Parent Support, Child Mode
- Memories system: Journal, Milestones, Appointment Notes
- Play Analyzer to record play interactions
- One‑click Report for specialists and schools

This implementation follows the PRD in `docs/Gestalts App overview.md` and visual tokens from `docs/Mobile App Style Guide.md`.

## Getting started

```
npm install
npm run android # or npm run web
```

## Tech
- Expo (SDK 53), React Native, TypeScript
- Navigation: React Navigation (stack + tabs)
- State: Zustand (persisted to AsyncStorage)
- UI: tokens from the style guide; gradient buttons; custom AppHeader

## Structure
- `src/theme`: tokens and provider
- `src/state`: persisted store for Memories and profile
- `src/screens`: Auth, Dashboard, Coach, Memories, Play, Report
- `src/components`: GradientButton, AppHeader
- `src/navigation`: Root stack and tabs

## Notes
- The AI chat area is a placeholder ready to integrate an API.
- Reports are generated locally from Memories and profile; they can be copied to clipboard.