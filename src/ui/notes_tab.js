/**
 * Notes Tab Feature
 * Adds a Notes tab to character sheets with category management
 */

import { CategoryEditor } from './category_editor';
import { CategoryManager } from '../services/category_manager';
import { NoteContextMenu } from './note_context_menu';

const SHEET_MODES = {
  PLAY: 1,
  EDIT: 2
};

/**
 * Initialize the notes tab feature
 */
export function initializeNotesTab() {
  loadTemplates([
    'modules/dnd5e-sheet-notes/templates/partials/note_item.hbs'
  ]);

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
  const el = html[0] || html;

  const root = el.closest('.app') || el.querySelector('.app') || el;

  if (!app.isEditable) {
    return;
  }

  await addNotesContent(app, root);

  addNotesTab(root);

  addNotesButtons(app, root);
}

/**
 * Add the Notes tab content to the sheet
 * @param {ActorSheet5e} app - The sheet application
 * @param {HTMLElement} el - The sheet element
 */
async function addNotesContent(app, el) {
  const tabBody = el.querySelector('.tab-body');
  if (!tabBody) {
    return;
  }

  let notesContent = tabBody.querySelector('.tab.dnd5e-sheet-notes[data-tab="notes"]');

  if (!notesContent) {
    const active = app._tabs?.[0]?.active === 'notes';

    await CategoryManager.runMigrations(app.actor);

    const templateData = await getNotesTabData(app.actor, active, app._mode);

    const notesHtml = await renderTemplate('modules/dnd5e-sheet-notes/templates/notes_tab.hbs', templateData);

    tabBody.insertAdjacentHTML('beforeend', notesHtml);

    notesContent = tabBody.querySelector('.tab.dnd5e-sheet-notes[data-tab="notes"]');
    activateNotesListeners(app.actor, app, notesContent);
  }
}

/**
 * Add the Notes tab navigation button
 * @param {HTMLElement} el - The sheet element
 */
function addNotesTab(el) {
  const tabsNav = el.querySelector('.tabs[data-group="primary"]');
  if (!tabsNav) {
    return;
  }

  if (tabsNav.querySelector('[data-tab="notes"]')) {
    return;
  }

  const notesTab = document.createElement('a');
  notesTab.className = 'item control';
  notesTab.dataset.group = 'primary';
  notesTab.dataset.tab = 'notes';
  notesTab.dataset.tooltip = 'dnd5e-sheet-notes.tab.label';
  notesTab.setAttribute('aria-label', game.i18n.localize('dnd5e-sheet-notes.tab.label'));
  notesTab.innerHTML = '<i class="fas fa-book-open"></i>';

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
  await CategoryManager.ensureDefaultCategory(actor);
  let categories = actor.getFlag('dnd5e-sheet-notes', 'categories') || [];

  categories.sort((a, b) => a.name.localeCompare(b.name));

  const allNotes = actor.items.filter(item => item.type === 'dnd5e-sheet-notes.note');

  const categoryData = categories.map(category => {
    const categoryNotes = allNotes.filter(note => {
      const noteCategory = note.system.category;
      if (!noteCategory || noteCategory === '') {
        return category.name === 'Notes';
      }
      return noteCategory === category.key;
    });

    const notes = categoryNotes.sort((a, b) => {
      if (category.ordering === 0) { // ALPHABETICAL
        return a.name.localeCompare(b.name);
      }
      return (a.sort || 0) - (b.sort || 0);
    });

    return {
      ...category,
      isDefault: category.name === 'Notes',
      notes,
      noteCount: notes.length,
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
  NoteContextMenu.initialize(container, app);

  container.querySelector('.add-category')?.addEventListener('click', async event => {
    event.preventDefault();
    CategoryEditor.show(actor);
  });

  container.querySelectorAll('.items-section.collapsible .items-header').forEach(header => {
    header.addEventListener('click', async event => {
      if (event.target.closest('.item-controls')) return;

      event.preventDefault();
      const categoryElement = event.currentTarget.closest('.items-section');
      const categoryId = categoryElement.dataset.categoryId;

      try {
        await CategoryManager.toggleCollapsed(actor, categoryId);
        app.render();
      } catch (error) {
        ui.notifications.error(error.message);
      }
    });
  });

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

  container.querySelectorAll('.item-control[data-action="delete-category"]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      const categoryId = event.currentTarget.dataset.categoryId;
      const categories = actor.getFlag('dnd5e-sheet-notes', 'categories') || [];
      const category = categories.find(c => c.key === categoryId);
      if (!category) return;

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
          await CategoryManager.delete(actor, categoryId);
        }
      } catch (error) {
        if (error.message !== 'Dialog was dismissed without pressing a button.') {
          ui.notifications.error(error.message);
        }
      }
    });
  });

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

  container.querySelectorAll('.item-control[data-action="delete-note"]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      const noteId = event.currentTarget.dataset.noteKey;
      const note = actor.items.get(noteId);
      if (!note) return;

      try {
        const confirm = await foundry.applications.api.DialogV2.confirm({
          window: {
            title: game.i18n.localize('dnd5e-sheet-notes.actions.delete'),
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
        if (error.message !== 'Dialog was dismissed without pressing a button.') {
          ui.notifications.error(error.message);
        }
      }
    });
  });

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

  if (form.querySelector('.create-child.dnd5e-sheet-notes')) {
    return;
  }

  const warningsDialog = form.querySelector('dialog.warnings');
  const insertBefore = warningsDialog || null;

  const addNoteBtn = document.createElement('button');
  addNoteBtn.type = 'button';
  addNoteBtn.className = 'gold-button create-child dnd5e-sheet-notes add-note';
  addNoteBtn.innerHTML = '<i class="fas fa-plus"></i>';
  addNoteBtn.title = 'Add Note';
  addNoteBtn.addEventListener('click', async event => {
    event.preventDefault();

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

      if (note) {
        note.sheet.render(true);
      }
    } catch (error) {
      ui.notifications.error(`Failed to create note: ${error.message}`);
    }
  });

  const addCategoryBtn = document.createElement('button');
  addCategoryBtn.type = 'button';
  addCategoryBtn.className = 'gold-button create-child dnd5e-sheet-notes add-category';
  addCategoryBtn.innerHTML = '<i class="fas fa-folder-plus"></i>';
  addCategoryBtn.title = 'Add Category';
  addCategoryBtn.addEventListener('click', async event => {
    event.preventDefault();
    CategoryEditor.show(app.actor);
  });

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

  const dragData = item.toDragData();

  event.dataTransfer.setData('text/plain', JSON.stringify(dragData));

  setTimeout(() => {
    const notesTab = li.closest('.tab.dnd5e-sheet-notes');
    if (notesTab) {
      notesTab.classList.add('dragging-active');
    }
  }, 0);

  const cleanup = () => {
    const notesTab = li.closest('.tab.dnd5e-sheet-notes');
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

  const data = TextEditor.getDragEventData(event);

  if (!data || data.type !== 'Item') return;

  const item = await fromUuid(data.uuid);
  if (!item || item.type !== 'dnd5e-sheet-notes.note') return;

  if (item.parent?.id !== app.actor.id) return;

  await CategoryManager.ensureDefaultCategory(app.actor);

  const dropTarget = event.target.closest('.items-section');
  if (!dropTarget) return;

  const targetCategoryId = dropTarget.dataset.categoryId;

  const categories = app.actor.getFlag('dnd5e-sheet-notes', 'categories') || [];
  const targetCategoryObj = categories.find(c => c.key === targetCategoryId);
  const targetCategory = (targetCategoryObj && targetCategoryObj.name === 'Notes') ? '' : targetCategoryId;
  const currentCategory = item.system.category || '';

  if (currentCategory === targetCategory) return;

  await item.update({
    'system.category': targetCategory
  });
}
