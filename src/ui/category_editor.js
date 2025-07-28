/**
 * An editor for creating and editing note categories
 * @extends {ApplicationV2}
 */
import { Category } from '../entities/category';

export class CategoryEditor extends foundry.applications.api
  .HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * @param {Actor} actor - The actor that owns the categories
   * @param {Object} [category] - The category to edit (if provided, editor is in edit mode)
   */
  constructor(actor, category = null) {
    super();
    this.actor = actor;
    this.category = category;
    this.isEditMode = !!category;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: 'dnd5e-sheet-notes-category-editor',
    classes: ['dnd5e-sheet-notes', 'category-editor', 'dnd5e2'],
    position: {
      width: 300
    },
    window: {
      title: 'dnd5e-sheet-notes.category.editor.title',
      icon: 'fas fa-folder',
      resizable: false
    },
    form: {
      handler: CategoryEditor.#onSave,
      submitOnChange: false,
      closeOnSubmit: true,
    }
  };

  /** @override */
  get title() {
    const key = this.isEditMode ? 'edit' : 'create';
    return game.i18n.localize(`dnd5e-sheet-notes.category.editor.title.${key}`);
  }

  /** @override */
  async _prepareContext(_options) {
    const context = {
      isEditMode: this.isEditMode,
      category: this.isEditMode ? this.category : {
        name: '',
        ordering: 0
      },
      isNotesCategory: this.isEditMode && this.category?.name === 'Notes',
      orderingOptions: [
        { value: 0, label: game.i18n.localize('dnd5e-sheet-notes.category.ordering.alphabetical') },
        { value: 1, label: game.i18n.localize('dnd5e-sheet-notes.category.ordering.manual') }
      ]
    };

    return context;
  }

  /** @override */
  static PARTS = {
    form: {
      template: 'modules/dnd5e-sheet-notes/templates/category_editor.hbs'
    }
  };

  /**
   * Handle save action
   * @param {Event} event - The click event
   * @param {HTMLElement} target - The button element
   * @private
   */
  static async #onSave(_event, _target) {
    const form = this.element.querySelector('form');
    const nameInput = form?.querySelector('input[name="name"]');
    const orderingInput = form?.querySelector('input[name="ordering"]:checked');

    const data = {
      name: nameInput?.value || '',
      ordering: parseInt(orderingInput?.value) || 0
    };

    const editor = this;

    const errors = editor.#validateFormData(data);
    if (errors.length > 0) {
      ui.notifications.error(errors[0]);
      return;
    }

    try {
      if (!editor.isEditMode) {
        await Category.create(editor.actor, {
          name: data.name.trim(),
          ordering: data.ordering
        });
      } else {
        const updates = {
          ordering: data.ordering
        };

        if (editor.category.name !== 'Notes') {
          updates.name = data.name.trim();
        }

        await editor.category.update(updates);
      }

      editor.close();
    } catch (error) {
      ui.notifications.error(error.message);
    }
  }

  /**
   * Validate form data
   * @param {Object} data - The form data to validate
   * @returns {string[]} Array of error messages
   * @private
   */
  #validateFormData(data) {
    const errors = [];

    if (!this.isEditMode) {
      if (!data.name || data.name.trim() === '') {
        errors.push(game.i18n.localize('dnd5e-sheet-notes.category.errors.name-required'));
      } else if (data.name.trim().length > 50) {
        errors.push(game.i18n.localize('dnd5e-sheet-notes.category.errors.name-too-long'));
      } else {
        const categories = this.actor.getFlag('dnd5e-sheet-notes', 'categories') || [];
        const nameExists = categories.some(cat => cat.name.toLowerCase() === data.name.trim().toLowerCase());
        if (nameExists) {
          errors.push(game.i18n.format('dnd5e-sheet-notes.category.errors.name-exists', { name: data.name }));
        }
      }
    }

    return errors;
  }

  /**
   * Show the category editor
   * @param {Actor} actor - The actor that owns the categories
   * @param {Object} [category] - The category to edit (if provided)
   * @returns {Promise<CategoryEditor>}
   */
  static async show(actor, category = null) {
    const editor = new CategoryEditor(actor, category);
    await editor.render(true);
    editor.element.querySelector('button.yes')
      ?.addEventListener('click', async event => {
        event.preventDefault();
        await CategoryEditor.#onSave.call(editor, event, event.currentTarget);
      });
    editor.element.querySelector('form')?.addEventListener('submit', async event => {
      event.preventDefault();
      await CategoryEditor.#onSave.call(editor, event, event.currentTarget);
    });

    editor.element.querySelectorAll('input[type="text"]').forEach(input => {
      input.addEventListener('keydown', async event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          await CategoryEditor.#onSave.call(editor, event, input);
        }
      });
    });
    return editor;
  }
}
