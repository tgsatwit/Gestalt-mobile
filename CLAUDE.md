# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Gestalts mobile application - a React Native app built with Expo for parents of children who are Gestalt Language Processors. The app provides AI coaching, memory tracking, and specialist preparation tools.

## Development Commands

### Running the Application
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platforms
npm run android  # Android emulator/device
npm run ios      # iOS simulator/device  
npm run web      # Web browser
```

## Architecture

### Tech Stack
- **Framework**: React Native with Expo (SDK 53)
- **TypeScript**: Strict mode enabled
- **Navigation**: React Navigation (native-stack + bottom-tabs)
- **State Management**: Zustand with AsyncStorage persistence
- **Styling**: Custom design tokens system (no external UI library)
- **Fonts**: Plus Jakarta Sans, Inter, Oooh Baby

### Key Directories
- `gestalts/` - Main app directory containing all source code
- `gestalts/src/screens/` - Main screens: Auth, Coach, Memories, Play, Report, Dashboard
- `gestalts/src/state/` - Zustand store for persisted app state (memories, profile)
- `gestalts/src/theme/` - Design tokens and theme provider
- `gestalts/src/navigation/` - Navigation structure with tabs and stack
- `gestalts/src/components/` - Reusable components (AppHeader, GradientButton)
- `docs/` - Product documentation and style guide

### Core Features & Data Model

**AI Coach** - Three interaction modes (Language Coach, Parent Support, Child Mode)

**Memories System**:
- Journal entries with mood tracking
- Milestones with dates and notes
- Appointment notes linked to specialists
- Play sessions with activity tracking

**State Management**: Single Zustand store (`useMemoriesStore`) persisted to AsyncStorage containing:
- Child profile (name, birthdate, stage)
- Arrays of memories (journal, milestones, appointmentNotes, playSessions)
- Action methods for adding new entries

**Navigation Flow**: 
- Auth (Login/Signup) → Main Navigation
- Tab navigation between Dashboard, Coach, Memories, Play, and Report screens

## Important Considerations

- Mobile-first design optimized for parent use on phones
- AI Coach integration is placeholder - ready for API connection
- Reports generate from local data and support clipboard export
- Follows design tokens from Mobile App Style Guide
- No testing framework currently configured
- No linting or formatting tools configured