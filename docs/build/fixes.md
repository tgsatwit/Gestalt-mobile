1. Storybook Feature

1.1 My Characters (Avatar Creation)

“Fix avatar creation flow in Storybook.
	•	Context: User selects/captures photo → app shows loading for ~2s → result is a blank circle (purple outline, white centre). Save button doesn’t work because no image is returned.
	•	Suspected Cause: API call is not waiting for Gemini 2.5 Flash Image Preview Model to complete before rendering.
	•	Fixes Required:
	•	Await Gemini image generation response properly.
	•	Render Pixar-style image returned by Gemini in placeholder circle.
	•	Disable Save button until a valid image is present.
	•	Ensure Regenerate triggers a fresh Gemini call and updates placeholder.
	•	Acceptance Criteria: Avatar image reliably shows after generation delay; Save works once an image exists; Regenerate replaces image.”

⸻

1.2 Story Wizard (Page Images)

“Fix story wizard image generation.
	•	Context: Story text generates correctly, but all page images are placeholders.
	•	Fixes Required:
	•	Replace placeholders with Gemini 2.5 Flash model responses.
	•	Add error handling: if Gemini fails, show message (‘Image generation failed, tap to retry’) instead of placeholder.
	•	Acceptance Criteria: Each page shows AI-generated illustration (Pixar style) unless error occurs.”

⸻

1.3 Library (My Stories Tab)

“Improve Library UX when no stories or when generation is in progress.
	•	Context: After wizard completion → user lands on My Stories. If no stories exist, the page is blank. If story is generating in background, no feedback is shown.
	•	Fixes Required:
	•	Show greyed-out placeholder card with status (‘Generating story…’) while generation runs.
	•	Replace placeholder with story once finished.
	•	Provide empty-state message (‘No stories yet. Create your first story!’) if truly empty.
	•	Acceptance Criteria: Library never appears blank; users always know whether a story is generating or list is empty.”

⸻

2. Memories Feature

2.1 Adding Items (Gestalt / Milestone / Appointment Note / Journal Entry)

“Fix Firestore addDoc error.
	•	Context: Error: ‘Function addDoc, called with invalid data. Unsupported field value: undefined’. Optional fields treated as mandatory; items not saving.
	•	Fixes Required:
	•	Update Firestore schema/validation to allow optional fields.
	•	Ensure only defined fields are sent in addDoc payload.
	•	Test saving Gestalt, Milestone, Journal Entry, Appointment Note independently.
	•	Acceptance Criteria: Items save even when optional fields are left blank.”

⸻

2.2 Audio Clip Recording in Milestones

“Extend audio recording support.
	•	Context: Add Gestalt page supports recording audio clip (child saying gestalt). Milestones only support photo/video.
	•	Fixes Required:
	•	Reuse audio recording component from Add Gestalt inside Milestones.
	•	Allow audio clips to be attached and saved to Firestore alongside photos/videos.
	•	Support playback when milestone is viewed.
	•	Acceptance Criteria: User can record + play audio in both Gestalt and Milestone items.”

⸻

2.3 Speech-to-Text Inputs (Microphone in Fields)

“Add microphone transcription button to input fields.
	•	Context: Journal entry, milestone details, appointment notes require typing. Want transcription option.
	•	Fixes Required:
	•	Add mic icon to each text input.
	•	On tap, start voice-to-text using Gemini STT or Whisper.
	•	Handle pauses → auto-stop.
	•	Insert transcription directly into input field.
	•	Acceptance Criteria: Consistent across Memories features; accurate transcription; smooth UX.”

⸻

2.4 Calendar Component (Date Picker)

“Enhance calendar to allow year selection.
	•	Context: Current date picker only scrolls months; scrolling back multiple years is tedious.
	•	Fixes Required:
	•	Add year scroll / year jump option.
	•	Build as reusable component.
	•	Replace all date pickers across app with new version.
	•	Acceptance Criteria: Users can quickly jump years in any calendar picker.”

⸻

3. Coach Screen

3.1 Coach Mode Dropdown Positioning

“Fix dropdown visibility issue in Coach screen.
	•	Context: Dropdown menu for coach mode appears below input, falls off-screen, options not visible.
	•	Fixes Required:
	•	Implement dropdown flipping logic: if not enough space below, render above input.
	•	Use overlay/portal with proper z-index so it isn’t clipped by parent containers.
	•	Handle safe area + keyboard.
	•	Acceptance Criteria: Dropdown always fully visible and selectable, regardless of screen space.”

⸻

4. Bottom Nav & Menus

4.1 White Gradient Overlay Height

“Adjust bottom nav overlay.
	•	Context: White gradient at bottom is too tall.
	•	Fixes Required:
	•	Reduce gradient height by ~50% globally.
	•	Keep safe-area padding intact.
	•	Acceptance Criteria: Gradient no longer crowds UI; still provides visual separation.”

⸻

4.2 Add Menu Consistency

“Unify Add button menu.
	•	Context: Clicking Add currently opens two menus (purple 3-icon + second one).
	•	Fixes Required:
	•	Remove purple 3-icon floating menu.
	•	Use single dropdown styled same as profile menu.
	•	Final menu items: Journal, Milestone, Appointment, Notes, DALTS List.
	•	Acceptance Criteria: Only one consistent menu appears; matches profile menu styling.”

⸻

4.3 Menu Z-Index / Layering

“Ensure menus render above all other UI.
	•	Context: Add + profile dropdown menus currently appear under white gradient and mic FAB.
	•	Fixes Required:
	•	Render via overlay/portal at top layer.
	•	Confirm menus sit above gradient and mic FAB.
	•	Acceptance Criteria: Menus are always visible and clickable.”

⸻

5. Profiles

5.1 Children Profiles Loading Bug

“Fix Children Profiles navigation.
	•	Context: Selecting Children Profiles from profile menu → only shows spinning ‘Loading Profiles’ animation.
	•	Fixes Required:
	•	Ensure navigation loads Child Profiles List screen.
	•	Query Firestore for children; display results.
	•	Empty-state: show message (‘No children yet’) + Add Child button.
	•	Acceptance Criteria: Children list loads reliably; Add Child flow works.”

⸻

5.2 Specialists (CRUD + Linking Model)

“Build Specialist Profiles feature.
	•	Context: Specialists not implemented yet. Need ability to create + manage specialists, and link to children.
	•	Fixes Required:
	•	Add Specialist Profiles menu item → opens Specialist List screen (same layout as Child Profiles).
	•	Add Specialist form with fields: name, speciality, start date (per child).
	•	Implement many-to-many linking: one specialist ↔ many children; one child ↔ many specialists.
	•	Suggested Firestore model:
	•	children collection
	•	specialists collection
	•	childSpecialists join collection with { childId, specialistId, startDate }
	•	UI: chips/badges to show linked entities in list/detail views.
	•	Acceptance Criteria: Specialists can be created, listed, linked to children, and viewed from either side.”

