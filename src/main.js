/**
 * 5e Sheet Notes & Trackers
 * A FoundryVTT module for D&D 5th Edition character sheet notes
 */

import { NoteModel } from './models/note_model';
import { NoteSheet } from './ui/note_sheet';
import { initializeNotesTab } from './ui/notes_tab';

Hooks.once('init', () => {
  console.log('5e Sheet Notes & Trackers | Module initialized');

  // Register the Note data model
  Object.assign(CONFIG.Item.dataModels, {
    'dnd5e-sheet-notes.note': NoteModel
  });

  // Configure the Note model
  NoteModel.setup();

  // Register the Note sheet
  DocumentSheetConfig.registerSheet(Item, 'dnd5e-sheet-notes', NoteSheet, {
    types: ['dnd5e-sheet-notes.note'],
    makeDefault: true
  });

  // Initialize the notes tab on character sheets
  initializeNotesTab();
});
