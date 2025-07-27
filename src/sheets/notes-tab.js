/**
 * Notes Tab Feature
 * Adds a Notes tab to character sheets
 */

/**
 * Initialize the notes tab feature
 */
export function initializeNotesTab() {
  // Register hooks for both PC and NPC sheets
  Hooks.on('renderActorSheet5eCharacter2', addNotesTab);
  Hooks.on('renderActorSheet5eNPC2', addNotesTab);
}

/**
 * Add the Notes tab to a character sheet
 * @param {ActorSheet5e} app - The sheet application
 * @param {HTMLElement|jQuery} html - The rendered HTML (can be jQuery object or DOM element)
 * @param {Object} data - The sheet data
 */
function addNotesTab(app, html, _data) {
  // Normalize to DOM element
  const el = html[0] || html;
  
  // Ensure we have the application root element
  const root = el.closest('.app') || el.querySelector('.app') || el;
  
  if (!app.isEditable) {
    return;
  }
  
  // Find the tabs navigation container
  const tabsNav = root.querySelector('.tabs[data-group="primary"]');
  if (!tabsNav) {
    return;
  }
  
  // Check if Notes tab already exists
  if (tabsNav.querySelector('[data-tab="notes"]')) {
    return;
  }
  
  // Create the Notes tab element
  const notesTab = document.createElement('a');
  notesTab.className = 'item control';
  notesTab.dataset.group = 'primary';
  notesTab.dataset.tab = 'notes';
  notesTab.dataset.tooltip = 'dnd5e-sheet-notes.tab.label';
  notesTab.setAttribute('aria-label', game.i18n.localize('dnd5e-sheet-notes.tab.label'));
  notesTab.innerHTML = '<i class="fas fa-book-open"></i>';
  
  // Append to end of tabs
  tabsNav.appendChild(notesTab);
}