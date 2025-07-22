/**
 * Notes Tab Feature
 * Adds a Notes tab to character sheets
 */

/**
 * Initialize the notes tab feature
 */
export function initializeNotesTab() {
  // Register hooks for both PC and NPC sheets
  Hooks.on('renderActorSheet5eCharacter2', injectNotesTab);
  Hooks.on('renderActorSheet5eNPC2', injectNotesTab);
}

/**
 * Inject the Notes tab into a character sheet
 * @param {ActorSheet5e} app - The sheet application
 * @param {jQuery} html - The rendered HTML
 */
function injectNotesTab(app, html) {
  const el = html[0] || html;

  // Check if tab already exists (in case of re-render)
  if (el.querySelector('.tabs [data-tab="notes"]')) {
    return;
  }

  // Find the tabs navigation container
  const tabsNav = el.querySelector('.tabs[data-group="primary"]');
  if (!tabsNav) {
    console.warn('5e Sheet Notes: Could not find tabs navigation');
    return;
  }

  // Create the Notes tab element
  const notesTab = document.createElement('a');
  notesTab.className = 'item control';
  notesTab.dataset.group = 'primary';
  notesTab.dataset.tab = 'notes';
  notesTab.dataset.tooltip = 'sheet-notes.tab-label';
  notesTab.setAttribute('aria-label', game.i18n.localize('sheet-notes.tab-label'));
  notesTab.innerHTML = '<i class="fas fa-sticky-note"></i>';

  // Append to end of tabs
  tabsNav.appendChild(notesTab);

  // Find the tab body container
  const tabBody = el.querySelector('.tab-body');
  if (!tabBody) {
    console.warn('5e Sheet Notes: Could not find tab body container');
    return;
  }

  // Create the Notes content container
  const notesContent = document.createElement('div');
  notesContent.className = 'tab notes';
  notesContent.dataset.group = 'primary';
  notesContent.dataset.tab = 'notes';

  // Empty content for now
  notesContent.innerHTML = '';

  // Append to tab body
  tabBody.appendChild(notesContent);
}
