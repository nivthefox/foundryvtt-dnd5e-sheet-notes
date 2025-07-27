/**
 * 5e Sheet Notes & Trackers
 * A FoundryVTT module for D&D 5th Edition character sheet notes
 */

import { NoteModel } from './models/NoteModel.js';
import { NoteSheet } from './sheets/NoteSheet.js';
import { initializeNotesTab } from './sheets/notes-tab.js';

Hooks.once('init', () => {
  console.log('5e Sheet Notes & Trackers | Module initialized');
  
  // Register the Note data model
  Object.assign(CONFIG.Item.dataModels, {
    "dnd5e-sheet-notes.note": NoteModel
  });
  
  // Register the Note sheet
  Items.registerSheet("dnd5e-sheet-notes", NoteSheet, {
    types: ["dnd5e-sheet-notes.note"],
    makeDefault: true
  });
  
  // Initialize the notes tab on character sheets
  initializeNotesTab();
});
