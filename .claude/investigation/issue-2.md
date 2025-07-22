# Investigation: Issue #2 - Note Storage System Using Actor Flags

## Investigation Date: 2025-07-22

## Issue Summary
Implement a system to link JournalEntryPages to actors and display them in the Notes tab. After 4+ hours of investigation, determined that custom Item types are not viable due to Foundry/D&D 5e system restrictions.

## Key Findings

### 1. Custom Item Type Approach (Failed)
- **Attempt 1**: Module subtypes as documented in Foundry docs
  - Result: D&D 5e system has fixed item types in `config$1`
  - Validation happens at Document creation before any module code runs
  
- **Attempt 2**: lib-wrapper to intercept validation
  - Result: Validation occurs in constructor, too early to intercept
  - Error: "type: 'note' is not a valid type for the Item Document class"

- **Attempt 3**: Create as 'loot' type and transform to 'note'
  - Result: Type validation is deeply integrated into the system
  - Cannot bypass without breaking other functionality

### 2. Actor Flags Approach (Current Investigation)

#### Data Structure
Notes would be stored in: `actor.flags['dnd5e-sheet-notes']`

```javascript
{
  notes: [
    {
      key: string,                    // foundry.utils.randomID()
      name: string,
      sort: number,
      text: {
        content: string,
        format: number               // 1 = HTML, 2 = Markdown
      },
      flags: {
        'dnd5e-sheet-notes': {
          category: string           // Category key
        }
      },
      _stats: {
        createdTime: number,
        modifiedTime: number,
        lastModifiedBy: string
      }
    }
  ],
  categories: [
    {
      key: string,                   // foundry.utils.randomID()
      name: string,
      backgroundColor: string,       // Hex color
      textColor: string,            // Hex color
      ordering: string              // "alphabetical" or "manual"
    }
  ]
}
```

#### Advantages
1. Full control over data structure
2. No system validation restrictions
3. Can store any custom fields
4. Direct actor association
5. Persists with actor data

#### Disadvantages
1. No built-in Item UI (drag/drop, context menus)
2. Must implement custom CRUD operations
3. No automatic permission handling
4. No compendium support
5. Cannot leverage item-based features

## Implementation Considerations

### 1. Data Management
- Need custom functions for CRUD operations
- Must handle data migration/versioning
- Need to ensure data consistency

### 2. UI Requirements
- Custom dialogs for create/edit
- Custom context menus
- Drag/drop handling for JournalEntryPages
- Category management interface

### 3. Integration Points
- Hook into actor update to persist changes
- Listen for journal page drops on Notes tab
- Handle deletion of linked journal pages

## Runtime Tests Needed

### Test 1: Flag Storage
```javascript
// Test storing data in actor flags
const actor = game.actors.getName('Test');
await actor.setFlag('dnd5e-sheet-notes', 'notes', [{
  key: foundry.utils.randomID(),
  name: 'Test Note',
  sort: 100000,
  text: {
    content: '<p>This is a test</p>',
    format: 1
  },
  flags: {
    'dnd5e-sheet-notes': {
      category: 'cat-1'
    }
  },
  _stats: {
    createdTime: Date.now(),
    modifiedTime: Date.now(),
    lastModifiedBy: game.user.id
  }
}]);

// Verify storage
console.log(actor.getFlag('dnd5e-sheet-notes', 'notes'));
```

### Test 2: Flag Updates
```javascript
// Test updating specific notes
const notes = actor.getFlag('dnd5e-sheet-notes', 'notes') || [];
notes.push({
  key: foundry.utils.randomID(),
  name: 'Another Note',
  sort: 200000,
  text: {
    content: '<p>More content</p>',
    format: 1
  },
  flags: {
    'dnd5e-sheet-notes': {
      category: 'cat-1'
    }
  },
  _stats: {
    createdTime: Date.now(),
    modifiedTime: Date.now(),
    lastModifiedBy: game.user.id
  }
});
await actor.setFlag('dnd5e-sheet-notes', 'notes', notes);
```

### Test 3: Performance
```javascript
// Test with many notes
const manyNotes = [];
for (let i = 0; i < 100; i++) {
  manyNotes.push({
    key: foundry.utils.randomID(),
    name: `Note ${i}`,
    sort: i * 100000,
    text: {
      content: `<p>Content for note ${i}</p>`,
      format: 1
    },
    flags: {
      'dnd5e-sheet-notes': {
        category: 'cat-1'
      }
    },
    _stats: {
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: game.user.id
    }
  });
}
await actor.setFlag('dnd5e-sheet-notes', 'notes', manyNotes);
// Check render performance
```

## Next Steps

1. Confirm flag approach with user
2. Design Note class for data management
3. Create NoteManager for CRUD operations
4. Implement UI components
5. Add drag/drop support
6. Handle journal page linking

## Questions for User

1. Are you comfortable with the limitations of the flag approach?
2. Should notes support rich text editing?
3. How important is drag/drop between actors?
4. Do notes need to be exportable/importable?
5. Should deleted journal pages remove the link or delete the note?

## Test Results

All runtime tests completed successfully:
- **Test 1**: Flag storage works as expected with array structure
- **Test 2**: Flag updates work correctly with array push operations
- **Test 3**: Performance remains acceptable with 100+ notes

## Conclusion

After extensive investigation and testing, the actor flags approach is confirmed as the viable solution:

1. **Custom Item Types**: Not possible due to Foundry's core validation occurring before any module code can intercept
2. **Actor Flags**: Fully functional with good performance and flexibility

### Final Data Structure (Confirmed)
```javascript
actor.flags['dnd5e-sheet-notes'] = {
  notes: [/* array of note objects matching JournalEntryPage structure */],
  categories: [/* array of category objects with styling and ordering */]
}
```

### Key Benefits
- Complete control over data structure
- Matches JournalEntryPage format for future compatibility
- No system validation conflicts
- Clean array-based structure for easy manipulation
- Performance tested and approved

### Implementation Path Forward
1. Create Note and Category classes for data management
2. Implement CRUD operations using flag updates
3. Build UI components (dialogs, context menus)
4. Add drag/drop support for JournalEntryPages
5. Handle category management and note organization

**Investigation Status**: COMPLETE - Ready for implementation planning