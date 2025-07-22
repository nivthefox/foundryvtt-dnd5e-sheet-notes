/**
 * 5e Sheet Notes & Trackers
 * Main module entry point
 */

const MODULE_ID = 'foundryvtt-5e-sheet-notes';

Hooks.once('init', () => {
  console.log(`Initializing ${MODULE_ID}`);
  
  // Module initialization will go here
});

Hooks.once('ready', () => {
  console.log(`${MODULE_ID} is ready`);
});

export { MODULE_ID };