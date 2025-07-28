import { NoteModel } from './models/note_model';
import { NoteSheet } from './ui/note_sheet';
import { initializeNotesTab } from './ui/notes_tab';
import { registerSearchEnhancement } from './ui/search_enhancement';

Hooks.once('init', () => {
  console.log('5e Sheet Notes & Trackers | Module initialized');

  Object.assign(CONFIG.Item.dataModels, {
    'dnd5e-sheet-notes.note': NoteModel
  });

  NoteModel.setup();

  DocumentSheetConfig.registerSheet(Item, 'dnd5e-sheet-notes', NoteSheet, {
    types: ['dnd5e-sheet-notes.note'],
    makeDefault: true
  });

  initializeNotesTab();
});

Hooks.once('setup', () => {
  registerSearchEnhancement();
});
