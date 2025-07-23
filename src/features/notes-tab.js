/**
 * Notes Tab Feature
 * Adds a Notes tab to character sheets
 */

import { CategoryEditor } from '../ui/CategoryEditor';
import { CategoryManager } from '../services/CategoryManager';
import { NoteManager } from '../services/NoteManager';

// Sheet mode constants
const SHEET_MODES = {
  PLAY: 1,
  EDIT: 2
};

/**
 * Initialize the notes tab feature
 */
export function initializeNotesTab() {
  // Register the partial template
  loadTemplates([
    'modules/dnd5e-sheet-notes/templates/partials/note-item.hbs'
  ]);

  // Register hooks for both PC and NPC sheets
  Hooks.on('renderActorSheet5eCharacter2', addNotes);
  Hooks.on('renderActorSheet5eNPC2', addNotes);
}

/**
 * Main entry point - Add notes functionality to a character sheet
 * @param {ActorSheet5e} app - The sheet application
 * @param {HTMLElement|jQuery} html - The rendered HTML (can be jQuery object or DOM element)
 * @param {Object} data - The sheet data
 */
async function addNotes(app, html, _data) {
  // Normalize to DOM element - could be the whole app or just the form
  const el = html[0] || html;
  
  // Ensure we have the application root element, not just the form
  const root = el.closest('.app') || el.querySelector('.app') || el;

  if (!app.isEditable) {
    return;
  }

  // Add the tab content
  await addNotesContent(app, root);
  
  // Add the tab navigation button
  addNotesTab(root);
  
  // Add the action buttons
  addNotesButtons(app, root);
}

/**
 * Add the Notes tab content to the sheet
 * @param {ActorSheet5e} app - The sheet application
 * @param {HTMLElement} el - The sheet element
 */
async function addNotesContent(app, el) {
  // Find the tab body container
  const tabBody = el.querySelector('.tab-body');
  if (!tabBody) {
    return;
  }

  // Check if Notes tab content already exists
  let notesContent = tabBody.querySelector('.tab.notes[data-tab="notes"]');
  
  if (!notesContent) {
    const active = app._tabs?.[0]?.active === 'notes';
    
    // Build the template data
    const templateData = await getNotesTabData(app.actor, active, app._mode);

    // Render the content (template already includes the tab wrapper)
    const notesHtml = await renderTemplate('modules/dnd5e-sheet-notes/templates/notes-tab.hbs', templateData);

    tabBody.insertAdjacentHTML('beforeend', notesHtml);

    notesContent = tabBody.querySelector('.tab.notes[data-tab="notes"]');
    activateNotesListeners(app.actor, app, notesContent);
  }
}

/**
 * Add the Notes tab navigation button
 * @param {HTMLElement} el - The sheet element
 */
function addNotesTab(el) {
  // Find the tabs navigation container
  const tabsNav = el.querySelector('.tabs[data-group="primary"]');
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
  notesTab.dataset.tooltip = 'sheet-notes.tab-label';
  notesTab.setAttribute('aria-label', game.i18n.localize('sheet-notes.tab-label'));
  notesTab.innerHTML = '<i class="fas fa-sticky-note"></i>';

  // Append to end of tabs
  tabsNav.appendChild(notesTab);
}

/**
 * Get data for the notes tab template
 * @param {Actor} actor - The actor
 * @param {boolean} active - Whether the notes tab is currently active
 * @param {number} mode - The sheet mode (1 = play, 2 = edit)
 * @returns {Object} Template data
 */
async function getNotesTabData(actor, active, mode) {
  // Get categories from the actor
  let categories = actor.getFlag('dnd5e-sheet-notes', 'categories') || [];

  // Get all notes from the actor
  const allNotes = NoteManager.getAllNotes(actor);

  // Ensure default "Notes" category exists
  if (!categories.find(c => c.name === 'Notes')) {
    categories = [{
      key: 'default-notes',
      name: 'Notes',
      ordering: 'alphabetical',
      color: null
    }, ...categories];
  }

  // Sort categories alphabetically
  categories.sort((a, b) => a.name.localeCompare(b.name));

  // Build category data with their notes
  const categoryData = categories.map(category => {
    // Filter notes for this category
    const categoryNotes = allNotes.filter(note => {
      const noteCategory = note.flags?.['dnd5e-sheet-notes']?.category;
      // Uncategorized notes go to default "Notes" category
      if (!noteCategory) {
        return category.key === 'default-notes' || category.name === 'Notes';
      }
      return noteCategory === category.key;
    });

    // Sort notes based on category ordering preference
    const notes = categoryNotes.sort((a, b) => {
      if (category.ordering === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      return (a.sort || 0) - (b.sort || 0);
    });

    return {
      ...category,
      isDefault: category.name === 'Notes' || category.key === 'default-notes',
      notes,
      active: active || false,
    };
  });

  return {
    categories: categoryData,
    active: active || false,
    editable: mode === SHEET_MODES.EDIT
  };
}

/**
 * Activate event listeners for the notes tab
 * @param {Actor} actor - The actor
 * @param {ActorSheet5e} app - The sheet application
 * @param {HTMLElement} container - The container element
 */
function activateNotesListeners(actor, app, container) {
  // Add Category button
  container.querySelector('.add-category')?.addEventListener('click', async event => {
    event.preventDefault();
    CategoryEditor.show(actor);
  });

  // Edit Category links
  container.querySelectorAll('.item-control[data-action="edit-category"]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      const categoryId = event.currentTarget.dataset.categoryId;
      const categories = actor.getFlag('dnd5e-sheet-notes', 'categories') || [];
      const category = categories.find(c => c.key === categoryId);
      if (category) {
        CategoryEditor.show(actor, category);
      }
    });
  });

  // Delete Category links
  container.querySelectorAll('.item-control[data-action="delete-category"]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      const categoryId = event.currentTarget.dataset.categoryId;
      const categories = actor.getFlag('dnd5e-sheet-notes', 'categories') || [];
      const category = categories.find(c => c.key === categoryId);
      if (!category) return;

      // Confirm deletion using DialogV2
      const confirm = await foundry.applications.api.DialogV2.confirm({
        window: {
          title: game.i18n.localize('sheet-notes.category.delete'),
          icon: 'fas fa-trash'
        },
        position: {
          width: 400
        },
        content: game.i18n.format('sheet-notes.category.confirm-delete', { name: category.name }),
        yes: {
          label: 'Yes',
          icon: 'fas fa-check'
        },
        no: {
          label: 'No',
          icon: 'fas fa-times'
        }
      });

      if (confirm) {
        try {
          await CategoryManager.deleteCategory(actor, categoryId);
          ui.notifications.info(game.i18n.format('sheet-notes.category.notifications.deleted', { name: category.name }));
        } catch (error) {
          ui.notifications.error(error.message);
        }
      }
    });
  });

  // Open note on click
  container.querySelectorAll('.item-name[data-action="open-note"]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      const noteKey = event.currentTarget.closest('[data-note-key]').dataset.noteKey;
      // TODO: Implement NoteViewer to open the note
      console.log('Opening note:', noteKey);
    });
  });

  // Edit note action
  container.querySelectorAll('.item-control[data-action="edit-note"]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      const noteKey = event.currentTarget.closest('[data-note-key]').dataset.noteKey;
      // TODO: Implement NoteViewer to edit the note
      console.log('Editing note:', noteKey);
    });
  });

  // Delete note action
  container.querySelectorAll('.item-control[data-action="delete-note"]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      const noteKey = event.currentTarget.dataset.noteKey;
      const note = NoteManager.getNote(actor, noteKey);
      if (!note) return;

      // Confirm deletion using DialogV2
      const confirm = await foundry.applications.api.DialogV2.confirm({
        window: {
          title: game.i18n.localize('sheet-notes.note.delete'),
          icon: 'fas fa-trash'
        },
        position: {
          width: 400
        },
        content: game.i18n.format('sheet-notes.note.confirm-delete', { name: note.name }),
        yes: {
          label: 'Yes',
          icon: 'fas fa-check'
        },
        no: {
          label: 'No',
          icon: 'fas fa-times'
        }
      });

      if (confirm) {
        try {
          await NoteManager.deleteNote(actor, noteKey);
          ui.notifications.info(game.i18n.format('sheet-notes.note.notifications.deleted', { name: note.name }));
        } catch (error) {
          ui.notifications.error(error.message);
        }
      }
    });
  });

  // Note context menu
  container.querySelectorAll('.item-control[data-context-menu]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      const noteKey = event.currentTarget.closest('[data-note-key]').dataset.noteKey;
      // TODO: Implement context menu for note actions
      console.log('Context menu for note:', noteKey);
    });
  });
}

/**
 * Add Notes buttons to the form
 * @param {ActorSheet5e} app - The sheet application
 * @param {HTMLElement} html - The rendered HTML
 */
function addNotesButtons(app, html) {
  const form = html.querySelector('form');
  if (!form) {
    console.warn('Sheet Notes: Could not find form element');
    return;
  }

  // Check if buttons already exist
  if (form.querySelector('.create-child.sheet-notes')) {
    return;
  }

  // Find the warnings dialog or the last child
  const warningsDialog = form.querySelector('dialog.warnings');
  const insertBefore = warningsDialog || null;

  // Add Note button
  const addNoteBtn = document.createElement('button');
  addNoteBtn.type = 'button';
  addNoteBtn.className = 'gold-button create-child sheet-notes add-note';
  addNoteBtn.innerHTML = '<i class="fas fa-plus"></i>';
  addNoteBtn.title = 'Add Note';
  addNoteBtn.addEventListener('click', async event => {
    event.preventDefault();
    // TODO: Implement add note functionality
    console.log('Add Note clicked');
  });

  // Add Category button
  const addCategoryBtn = document.createElement('button');
  addCategoryBtn.type = 'button';
  addCategoryBtn.className = 'gold-button create-child sheet-notes add-category';
  addCategoryBtn.innerHTML = '<i class="fas fa-folder-plus"></i>';
  addCategoryBtn.title = 'Add Category';
  addCategoryBtn.addEventListener('click', async event => {
    event.preventDefault();
    CategoryEditor.show(app.actor);
  });

  // Insert before warnings dialog or at the end
  if (insertBefore) {
    form.insertBefore(addNoteBtn, insertBefore);
    form.insertBefore(addCategoryBtn, insertBefore);
  } else {
    form.appendChild(addNoteBtn);
    form.appendChild(addCategoryBtn);
  }
}
