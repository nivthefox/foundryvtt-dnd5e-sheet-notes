/**
 * Notes Tab Feature
 * Adds a Notes tab to character sheets
 */

import { CategoryEditor } from '../ui/CategoryEditor';
import { CategoryManager } from '../services/CategoryManager';

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
 * @param {HTMLElement} html - The rendered HTML
 * @param {Object} data - The sheet data
 */
async function addNotesTab(app, html, _data) {
  const active = app._tabs?.[0]?.active === 'notes';
  const el = html[0] || html;

  if (!app.isEditable) {
    return;
  }

  // Find the tab body container
  const tabBody = el.querySelector('.tab-body');
  if (!tabBody) {
    return;
  }

  // Build the template data
  const templateData = await getNotesTabData(app.actor, active);

  // Render the content (template already includes the tab wrapper)
  const notesHtml = await renderTemplate('modules/dnd5e-sheet-notes/templates/notes-tab.hbs', templateData);

  tabBody.insertAdjacentHTML('beforeend', notesHtml);

  const notesContent = tabBody.querySelector('.tab.notes[data-tab="notes"]');
  activateNotesListeners(app.actor, app, notesContent);

  // Find the tabs navigation container
  const tabsNav = el.querySelector('.tabs[data-group="primary"]');
  if (!tabsNav) {
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
 * @returns {Object} Template data
 */
async function getNotesTabData(actor, active) {
  // Get categories from the actor
  const categories = actor.getFlag('dnd5e-sheet-notes', 'categories') || [];

  // Get associations
  const associations = actor.getFlag('dnd5e-sheet-notes', 'associations') || {};

  // Build category data with their pages
  const categoryData = categories.map(category => {
    const pages = (associations[category.key] || []).map(pageId => {
      // TODO: Look up actual journal entry page data
      return {
        id: pageId,
        name: 'Page Name', // Placeholder
        uuid: `JournalEntryPage.${pageId}`
      };
    });

    return {
      ...category,
      isDefault: category.name === 'Notes',
      pages,
      active: active || false,
    };
  });

  return {
    categories: categoryData,
    active: active || false,
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
}
