/**
 * 5e Sheet Notes & Trackers
 * Main module entry point
 */

import { initializeNotesTab } from './features/notes-tab';
import { registerNoteTests } from './models/Note.quench';
import { registerNoteManagerTests } from './services/NoteManager.quench';
import { registerCategoryTests } from './models/Category.quench';
import { registerCategoryManagerTests } from './services/CategoryManager.quench';

Hooks.once('init', () => {
  // Initialize the notes tab feature
  initializeNotesTab();

  // Register Quench tests if Quench module is available
  if (game.modules.get('quench')?.active) {
    registerNoteTests();
    registerNoteManagerTests();
    registerCategoryTests();
    registerCategoryManagerTests();
  }
});
