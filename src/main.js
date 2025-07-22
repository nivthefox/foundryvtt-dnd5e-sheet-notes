/**
 * 5e Sheet Notes & Trackers
 * Main module entry point
 */

import { id as module_id } from '../module.json';
import { initializeNotesTab } from './features/notes-tab';

Hooks.once('init', () => {
  console.log(`Initializing ${module_id}`);

  // Initialize the notes tab feature
  initializeNotesTab();
});

Hooks.once('ready', () => {
  console.log(`${module_id} is ready`);
});
