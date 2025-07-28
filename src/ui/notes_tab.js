/**
 * Notes Tab Feature
 * Adds a Notes tab to character sheets with category management
 */

import { CategoryEditor } from './category_editor';
import { CategoryManager } from '../services/category_manager';
import { NoteContextMenu } from './note_context_menu';

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
    'modules/dnd5e-sheet-notes/templates/partials/note_item.hbs'
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
    const notesHtml = await renderTemplate('modules/dnd5e-sheet-notes/templates/notes_tab.hbs', templateData);

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
  notesTab.dataset.tooltip = 'dnd5e-sheet-notes.tab.label';
  notesTab.setAttribute('aria-label', game.i18n.localize('dnd5e-sheet-notes.tab.label'));
  notesTab.innerHTML = '<i class="fas fa-book-open"></i>';

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

  // Ensure default "Notes" category exists
  if (!categories.find(c => c.name === 'Notes')) {
    categories = [{
      key: 'default-notes',
      name: 'Notes',
      ordering: 0
    }, ...categories];
  }

  // Sort categories alphabetically
  categories.sort((a, b) => a.name.localeCompare(b.name));

  // Get all Note items from the actor
  const allNotes = actor.items.filter(item => item.type === 'dnd5e-sheet-notes.note');

  // Build category data with their associated notes
  const categoryData = categories.map(category => {
    // Filter notes for this category
    const categoryNotes = allNotes.filter(note => {
      const noteCategory = note.system.category;
      // Uncategorized notes (empty string, null, or undefined) go to default "Notes" category
      if (!noteCategory || noteCategory === '') {
        return category.key === 'default-notes' || category.name === 'Notes';
      }
      return noteCategory === category.key;
    });

    // Sort notes based on category ordering preference
    const notes = categoryNotes.sort((a, b) => {
      if (category.ordering === 0) { // ALPHABETICAL
        return a.name.localeCompare(b.name);
      }
      // MANUAL ordering would use sort field when we implement drag & drop
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
  // Initialize context menu system
  NoteContextMenu.initialize(container, app);

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
      try {
        const confirm = await foundry.applications.api.DialogV2.confirm({
          window: {
            title: game.i18n.localize('dnd5e-sheet-notes.category.delete'),
            icon: 'fas fa-trash'
          },
          position: {
            width: 400
          },
          content: game.i18n.format('dnd5e-sheet-notes.category.confirm-delete', { name: category.name }),
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
          await CategoryManager.deleteCategory(actor, categoryId);
        }
      } catch (error) {
        // Dialog was dismissed (same as clicking "No")
        if (error.message !== 'Dialog was dismissed without pressing a button.') {
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
      const noteId = event.currentTarget.closest('[data-note-key]').dataset.noteKey;
      const note = actor.items.get(noteId);
      if (note) {
        note.sheet.render(true);
      }
    });
  });

  // Edit note action
  container.querySelectorAll('.item-control[data-action="edit-note"]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      const noteId = event.currentTarget.dataset.noteKey;
      const note = actor.items.get(noteId);
      if (note) {
        note.sheet.render(true);
      }
    });
  });

  // Delete note action
  container.querySelectorAll('.item-control[data-action="delete-note"]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      const noteId = event.currentTarget.dataset.noteKey;
      const note = actor.items.get(noteId);
      if (!note) return;

      // Confirm deletion using DialogV2
      try {
        const confirm = await foundry.applications.api.DialogV2.confirm({
          window: {
            title: game.i18n.localize('dnd5e-sheet-notes.note.delete'),
            icon: 'fas fa-trash'
          },
          position: {
            width: 400
          },
          content: `Are you sure you want to delete the note "${note.name}"?`,
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
          await note.delete();
        }
      } catch (error) {
        // Dialog was dismissed (same as clicking "No")
        if (error.message !== 'Dialog was dismissed without pressing a button.') {
          ui.notifications.error(error.message);
        }
      }
    });
  });

  // Setup drag and drop using Foundry's system
  setupNoteDragDrop(app, container);
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
  if (form.querySelector('.create-child.dnd5e-sheet-notes')) {
    return;
  }

  // Find the warnings dialog or the last child
  const warningsDialog = form.querySelector('dialog.warnings');
  const insertBefore = warningsDialog || null;

  // Add Note button
  const addNoteBtn = document.createElement('button');
  addNoteBtn.type = 'button';
  addNoteBtn.className = 'gold-button create-child dnd5e-sheet-notes add-note';
  addNoteBtn.innerHTML = '<i class="fas fa-plus"></i>';
  addNoteBtn.title = 'Add Note';
  addNoteBtn.addEventListener('click', async event => {
    event.preventDefault();

    // Create a new Note item
    try {
      const noteData = {
        name: 'New Note',
        type: 'dnd5e-sheet-notes.note',
        img: 'icons/svg/book.svg',
        system: {
          description: {
            value: ''
          },
          category: ''
        }
      };

      const [note] = await app.actor.createEmbeddedDocuments('Item', [noteData]);

      // Open the new note for editing
      if (note) {
        note.sheet.render(true);
      }
    } catch (error) {
      ui.notifications.error(`Failed to create note: ${error.message}`);
    }
  });

  // Add Category button
  const addCategoryBtn = document.createElement('button');
  addCategoryBtn.type = 'button';
  addCategoryBtn.className = 'gold-button create-child dnd5e-sheet-notes add-category';
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


/**
 * Setup drag and drop for note items using Foundry's system
 * @param {ActorSheet5e} app - The sheet application
 * @param {HTMLElement} container - The notes tab container
 */
function setupNoteDragDrop(app, container) {
  // Create a new DragDrop handler for the notes tab
  const dragDrop = new DragDrop({
    dragSelector: '.item[data-item-id]',
    dropSelector: '.items-section',
    permissions: {
      dragstart: app._canDragStart.bind(app),
      drop: app._canDragDrop.bind(app)
    },
    callbacks: {
      dragstart: handleNoteDragStart.bind(null, app),
      drop: handleNoteDrop.bind(null, app)
    }
  });

  // Bind the drag drop handler to the container
  dragDrop.bind(container);
}

/**
 * Handle drag start for note items
 * @param {ActorSheet5e} app - The sheet application
 * @param {DragEvent} event - The drag start event
 */
function handleNoteDragStart(app, event) {
  const li = event.currentTarget;
  const itemId = li.dataset.itemId;

  if (!itemId) return;

  const item = app.actor.items.get(itemId);
  if (!item || item.type !== 'dnd5e-sheet-notes.note') return;

  // Get drag data from the item
  const dragData = item.toDragData();

  // Set the drag data
  event.dataTransfer.setData('text/plain', JSON.stringify(dragData));

  // Add visual feedback
  setTimeout(() => {
    const notesTab = li.closest('.tab.notes');
    if (notesTab) {
      notesTab.classList.add('dragging-active');
    }
  }, 0);

  // Store cleanup function for dragend
  const cleanup = () => {
    const notesTab = li.closest('.tab.notes');
    if (notesTab) {
      notesTab.classList.remove('dragging-active');
    }
    li.removeEventListener('dragend', cleanup);
  };

  li.addEventListener('dragend', cleanup);
}

/**
 * Handle drop on category sections
 * @param {ActorSheet5e} app - The sheet application
 * @param {DragEvent} event - The drop event
 */
async function handleNoteDrop(app, event) {
  event.preventDefault();

  // Get the drag data
  const data = TextEditor.getDragEventData(event);

  if (!data || data.type !== 'Item') return;

  // Get the item from the drag data
  const item = await fromUuid(data.uuid);
  if (!item || item.type !== 'dnd5e-sheet-notes.note') return;

  // Make sure this item belongs to the current actor
  if (item.parent?.id !== app.actor.id) return;

  // Get target category ID from the drop target
  const dropTarget = event.target.closest('.items-section');
  if (!dropTarget) return;

  const targetCategoryId = dropTarget.dataset.categoryId;

  // Convert category ID (default-notes should be empty string)
  const targetCategory = targetCategoryId === 'default-notes' ? '' : targetCategoryId;
  const currentCategory = item.system.category || '';

  // Don't update if already in this category
  if (currentCategory === targetCategory) return;

  // Update the item's category
  await item.update({
    'system.category': targetCategory
  });
}
