# Implementation Plan: Issue #1 - Add Notes Tab to Character Sheets

## Overview
Add a new "Notes" tab to both PC and NPC character sheets that integrates seamlessly with the existing tab system.

## User Experience Flow

### Tab Location
- Notes tab appears **at the end** of the tab navigation
- Uses a sticky note icon (Font Awesome: `fa-sticky-note`)
- Tooltip displays "Notes" (localized)
- Maintains consistent styling with other tabs

### Tab Behavior
1. **Initial State**: Tab is inactive when first added
2. **Switching**: Clicking the Notes tab activates it and shows the notes content
3. **Persistence**: Selected tab state persists across:
   - Sheet closes and reopens
   - Sheet re-renders (e.g., after data updates)
   - Page refreshes
4. **Visual Feedback**: Active tab highlighted with existing tab styling

### Content Area
- Empty state is completely empty (no placeholder text)
- Content area matches existing tab styling and spacing

## Technical Integration Approach

### Hook Points
- **PC Sheets**: `renderActorSheet5eCharacter2` 
- **NPC Sheets**: `renderActorSheet5eNPC2`
- Both hooks use identical injection logic via lib-wrapper

### DOM Structure Requirements

#### Tab Navigation Element
- Parent: `.tabs` navigation container
- Position: Append to end of tabs list
- Classes: `item control`
- Attributes:
  - `data-group="primary"`
  - `data-tab="notes"`
  - `data-tooltip="ACTOR.Notes"` (for localization)
  - `aria-label="Notes"`

#### Content Container
- Parent: `.tab-body` section
- Classes: `tab notes`
- Attributes:
  - `data-group="primary"`
  - `data-tab="notes"`

### State Management
- **No custom state required** - Investigation confirmed Foundry's tab controller handles persistence
- Tab state maintained in `sheet._tabs[0].active`
- Switching tabs properly updates both UI and internal state

## Implementation Steps

### Phase 1: Core Tab Integration
1. Create `src/features/notes-tab.js` module
2. Register lib-wrapper hooks for both sheet types
3. Implement tab injection logic
4. Add empty content container

### Phase 2: Localization
1. Add translation keys to `lang/en.json`:
   - `ACTOR.Notes`: "Notes"
2. Use `game.i18n.localize()` for all user-facing text

### Phase 3: Styling
1. Create `src/styles/notes-tab.scss`
2. Import into main stylesheet
3. Add minimal styling for content area consistency

## Testing Scenarios

### Functional Tests
1. **Tab Injection**
   - Tab appears at end of tab list for PC sheets
   - Tab appears at end of tab list for NPC sheets
   - Tab has correct icon and tooltip

2. **Tab Switching**
   - Clicking Notes tab shows notes content
   - Clicking other tabs hides notes content
   - Active state styling applied correctly

3. **State Persistence**
   - Select Notes tab → Close sheet → Reopen → Notes tab still selected
   - Select Notes tab → Update actor data → Tab remains selected
   - Select Notes tab → Refresh page → Tab state restored

### Edge Cases
1. Sheets with custom tab configurations
2. Multiple sheets open simultaneously
3. Rapid tab switching
4. Sheet re-renders during tab animation

## UI/UX Considerations

### Visual Design
- Match existing D&D 5e tab styling exactly
- Use system color variables for theming support
- Ensure icon size matches other tab icons

### Accessibility
- Include proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

### Performance
- Minimal DOM manipulation
- No event listener leaks
- Clean up on sheet close

## Questions for Clarification

1. **Icon Choice**: Is `fa-sticky-note` appropriate, or would you prefer a different icon?
2. **Localization**: Any specific wording preferences for the tab label?

## Success Criteria
- [ ] Notes tab appears on all character sheets
- [ ] Tab switching works smoothly
- [ ] State persists across all scenarios
- [ ] No console errors or warnings
- [ ] Passes all Playwright tests
- [ ] Build and lint checks pass

---

**Does this plan look correct to you?** I'm ready to proceed with implementation once you approve the approach.