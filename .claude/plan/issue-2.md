# Implementation Plan: Issue #2 - Note Storage System Using Actor Flags

## Plan Date: 2025-07-22

## Issue Summary
Implement the core note storage system using actor flags, based on investigation showing custom Item types are not viable.

## Scope (Issue #2 ONLY)
This issue focuses ONLY on:
- Data structure for storing notes in actor flags
- CRUD operations for managing notes
- Data persistence and integrity
- Performance with 50+ notes
- Conversion to/from JournalEntryPage format

This issue does NOT include:
- Categories (issue #3)
- UI components (later issues)
- Display/rendering (issue #5)
- Drag-drop functionality (issues #7, #8)

## Implementation Approach

### Data Storage
Location: `actor.flags['dnd5e-sheet-notes'].notes` (ARRAY)

### Note Structure
```javascript
// actor.flags['dnd5e-sheet-notes'].notes is an ARRAY containing:
[
  {
    key: string,                    // foundry.utils.randomID()
    name: string,
    sort: number,
    text: {
      content: string,              // HTML content (always present)
      format: number,               // 1 = HTML (only format for initial implementation)
      markdown: string              // Markdown source (not used in initial implementation)
    },
    flags: {
      'dnd5e-sheet-notes': {
        category: string           // Category key (for future use)
      }
    },
    _stats: {
      createdTime: number,
      modifiedTime: number,
      lastModifiedBy: string
    }
  },
  // ... more note objects
]
```

## Core Implementation

### 1. Note Class
Create `Note` class for data validation:
- Constructor accepting note data object
- `update()` - Modify note properties
- `toObject()` - Export for storage
- `clone()` - Create copy for editing
- `validate()` - Ensure data integrity
- `toJournalEntryPage()` - Convert to JournalEntryPage format
- Static `fromJournalEntryPage(page)` - Create Note from JournalEntryPage

### 2. NoteManager Service
Create `NoteManager` class with static methods:

#### Create
- `createNote(actor, noteData)`
- Generates unique key using `foundry.utils.randomID()`
- Sets sort value (default 100000, increment by 1)
- Sets creation metadata in `_stats`
- Adds to notes array
- Updates actor flags

#### Read
- `getNote(actor, noteKey)`
- `getAllNotes(actor)` - Returns the notes array
- `getNoteCount(actor)`

#### Update
- `updateNote(actor, noteKey, updates)`
- Validates note exists
- Updates `_stats.modifiedTime` and `_stats.lastModifiedBy`
- Merges changes
- Saves entire notes array to actor flags

#### Delete
- `deleteNote(actor, noteKey)`
- `deleteAllNotes(actor)`
- Removes from notes array
- Updates actor flags with modified array

#### Conversion
- `createNoteFromJournalPage(actor, journalEntryPage)`
- `exportNoteToJournalPage(actor, noteKey)`

#### Reorder
- `reorderNotes(actor, noteKeys)`
- Updates sort values
- Maintains sort spacing

### 3. Conversion Methods

#### toJournalEntryPage()
Converts Note to JournalEntryPage-compatible object:
```javascript
{
  name: note.name,
  type: "text",
  text: {
    content: note.text.content,
    format: note.text.format,
    markdown: note.text.markdown
  },
  sort: note.sort,
  flags: note.flags
}
```

#### fromJournalEntryPage(page)
Creates Note from JournalEntryPage:
```javascript
{
  key: foundry.utils.randomID(),
  name: page.name,
  sort: page.sort,
  text: {
    content: page.text.content,
    format: page.text.format,
    markdown: page.text.markdown || undefined
  },
  flags: {
    'dnd5e-sheet-notes': {
      category: null,
      sourcePageUuid: page.uuid  // Track original source
    }
  },
  _stats: {
    createdTime: Date.now(),
    modifiedTime: Date.now(),
    lastModifiedBy: game.user.id
  }
}
```

### 4. Data Management

#### Flag Initialization
- Check if notes array exists
- Initialize empty array if needed: `[]`
- Handle migration from future versions

#### Validation
- Required fields: key, name, sort, text, _stats
- text.content must always be present (HTML)
- text.format must be 1 or 2
- text.markdown only present when format === 2
- Ensure sort values are numbers

#### Performance
- Direct array manipulation
- Batch updates when possible
- Single flag update per operation

## Testing Plan

### Storage Tests
1. Create note with HTML format (format = 1)
2. Update note fields
3. Update note fields
4. Delete single note
5. Handle 50+ notes efficiently
6. Verify notes array structure

### Conversion Tests
1. Convert JournalEntryPage to Note
2. Convert Note to JournalEntryPage format
3. Verify markdown field handling
4. Test with both HTML and Markdown pages

### Performance Tests
1. Measure time for 50+ note operations
2. Test array manipulation performance
3. Verify single flag update per operation

### Edge Cases
1. Empty notes array
2. Missing text.markdown when format is HTML
3. Present text.markdown when format is Markdown
4. Duplicate keys in array

## Implementation Steps

1. Create `src/notes/Note.js` class
2. Create `src/notes/NoteManager.js` service
3. Implement conversion methods
4. Add flag initialization in module setup
5. Implement CRUD methods on array
6. Add data validation
7. Test with 50+ notes

## Implementation Notes

1. **Format**: HTML only for initial implementation (format = 1)
2. **Sort values**: Default sort = 100000, increment by 1 for each new note
3. **HTML validation**: ProseMirror (built into Foundry) will handle content validation

## Open Questions

1. Should `sourcePageUuid` be tracked when converting from JournalEntryPage?
2. Should the conversion preserve all flags or just specific ones?
3. What should happen to JournalEntryPage-specific fields (like `src` for images) during conversion?

---

## Does this plan look correct to you?

This plan implements the note structure with the clarified text object (content, format, markdown), explicitly uses an array for notes storage, and includes conversion methods to/from JournalEntryPage format.