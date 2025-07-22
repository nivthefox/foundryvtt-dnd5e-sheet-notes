# Investigation: Issue #1 - Add Notes Tab to Character Sheets

## Issue Summary
Add a new "Notes" tab to both PC and NPC character sheets with proper tab switching and state persistence across sheet re-renders.

## Key Findings from Pre-Investigation

### Tab Injection Pattern
From sosly-5e-house-rules investigation:
- Successfully tested adding tabs to character sheets
- Tab structure: `<a class="item control" data-tab="notes">` in navigation
- Content area: `<div class="tab notes" data-group="primary" data-tab="notes">`
- Standard Foundry tab switching works once injected

### Sheet Hooks
- PC sheets: `renderActorSheet5eCharacter2`
- NPC sheets: `renderActorSheet5eNPC2`
- Both use identical DOM structure for tabs

### Technical Requirements
1. Inject tab into existing navigation (after Biography tab)
2. Add corresponding content div to tab body
3. Preserve tab state across sheet re-renders
4. Handle tab switching events properly

## Runtime Investigation Results

### 1. Tab System Structure
- **Sheet Class**: `ActorSheet5eCharacter2`
- **Tab Controller**: Uses `Tabs5e` class (array with single controller)
- **Tab Navigation**: Located in `.tabs` with structure:
  ```html
  <a class="item control" data-group="primary" data-tab="notes" data-tooltip="..." aria-label="...">
    <i class="fas fa-icon"></i>
  </a>
  ```
- **Current Tabs**: details, inventory, features, spells, effects, biography, bastion (hidden), special-traits

### 2. Tab Content Structure
- **Container**: `<section class="tab-body">`
- **Content Divs**: Each tab has corresponding div:
  ```html
  <div class="tab biography" data-group="primary" data-tab="biography">
    <!-- tab content -->
  </div>
  ```
- **Active Tab**: Gets `active` class on both navigation link and content div

### 3. Tab State Persistence
- **State persists automatically** across sheet re-renders
- Tab controller maintains state in `sheet._tabs[0].active`
- Switching tabs with `sheet._tabs[0].activate("tabname")` persists through renders
- No additional state management needed!

## Implementation Approach

Based on the investigation, the implementation is straightforward:

1. **Hook into sheet render events** - Use `renderActorSheet5eCharacter2` and `renderActorSheet5eNPC2`
2. **Inject tab after Biography** - Add `<a>` element to `.tabs` navigation
3. **Add content div** - Insert corresponding `<div>` in `.tab-body`
4. **Let Foundry handle state** - Tab persistence works automatically, no custom state needed
5. **Apply consistent styling** - Match existing tab classes and structure

### Key Code Pattern
```javascript
function injectNotesTab(app, html) {
    const el = html[0] || html;
    
    // Find biography tab and insert after it
    const biographyTab = el.querySelector('.tabs [data-tab="biography"]');
    if (!biographyTab) return;
    
    // Create notes tab
    const notesTab = document.createElement('a');
    notesTab.className = 'item control';
    notesTab.dataset.group = 'primary';
    notesTab.dataset.tab = 'notes';
    notesTab.dataset.tooltip = 'Notes'; // Will be localized
    notesTab.innerHTML = '<i class="fas fa-sticky-note"></i>';
    
    // Insert after biography
    biographyTab.after(notesTab);
    
    // Add content div
    const tabBody = el.querySelector('.tab-body');
    const notesContent = document.createElement('div');
    notesContent.className = 'tab notes';
    notesContent.dataset.group = 'primary';
    notesContent.dataset.tab = 'notes';
    notesContent.innerHTML = '<p>Notes content will go here</p>';
    
    tabBody.appendChild(notesContent);
}
```

## Next Steps
1. Create feature module structure
2. Implement tab injection
3. Add localization
4. Test with both PC and NPC sheets
5. Verify tab persistence works correctly