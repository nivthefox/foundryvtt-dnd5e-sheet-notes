/**
 * An application for viewing and editing notes
 * @extends {ApplicationV2}
 */
import { NoteManager } from '../services/NoteManager';

export class NoteViewer extends foundry.applications.api
  .HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * Sheet modes
   * @enum {number}
   */
  static MODES = {
    PLAY: 1,
    EDIT: 2
  };
  /**
   * @param {Actor} actor - The actor that owns the note
   * @param {Object} note - The note to view/edit
   */
  constructor(actor, note) {
    super();
    this.actor = actor;
    this.note = note;

    // Track edit mode internally
    this._mode = this.constructor.MODES.PLAY; // Default to view mode
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: 'sheet-notes-viewer',
    classes: ['sheet-notes', 'note-viewer', 'dnd5e2'],
    position: {
      width: 600,
      height: 700
    },
    window: {
      title: 'sheet-notes.note.viewer.title',
      icon: 'fas fa-file-alt',
      resizable: true
    }
  };

  /** @override */
  get title() {
    return game.i18n.format('sheet-notes.note.viewer.title', { name: this.note.name });
  }

  /**
   * Get the editor target path
   * @type {string}
   */
  get editorTarget() {
    return `flags.dnd5e-sheet-notes.notes.${this.note.key}.content`;
  }

  /**
   * Is the current user able to edit this note?
   * @type {boolean}
   */
  get isEditable() {
    return this.actor.isOwner;
  }

  /**
   * Is the application currently in edit mode?
   * @type {boolean}
   */
  get isEditMode() {
    return this._mode === this.constructor.MODES.EDIT;
  }

  /** @override */
  async _prepareContext(_options) {
    // Enrich the note content for display
    const enrichedContent = await TextEditor.enrichHTML(this.note.text?.content || '', {
      async: true,
      relativeTo: this.actor
    });

    const context = {
      note: this.note,
      enrichedContent,
      isEditMode: this.isEditMode,
      isEditable: this.isEditable,
      editorTarget: `flags.dnd5e-sheet-notes.notes.${this.note.key}.content`
    };

    return context;
  }

  /** @override */
  static PARTS = {
    form: {
      template: 'modules/dnd5e-sheet-notes/templates/note-viewer.hbs'
    }
  };


  /**
   * Handle the user toggling the sheet mode.
   * @param {Event} event  The triggering event.
   * @protected
   */
  async _onChangeSheetMode(event) {
    const { MODES } = this.constructor;
    const toggle = event.currentTarget;
    const wasEditMode = this._mode === MODES.EDIT;

    // If we're leaving edit mode, capture the content BEFORE changing anything
    if (wasEditMode && !toggle.checked) {
      // Try to find the editor content directly in the DOM
      // Since the appendChild error happens but the editor still works,
      // let's look for it in the actual DOM
      const editorContent = this.element.querySelector('prose-mirror.editor-content');

      if (editorContent) {
        // Look for the ProseMirror content area within the editor
        const pmContent = editorContent.querySelector('.ProseMirror');

        if (pmContent) {
          // Get just the content, not the UI
          let content = pmContent.innerHTML;
          // Remove ProseMirror trailing break elements
          content = content.replace(/<br\s+class="ProseMirror-trailingBreak">/g, '');
          this.note.text = this.note.text || {};
          this.note.text.content = content;
        }
      } else if (editorContent?._editor?.instance) {
        // ProseMirror editor found - get the actual document content
        const editor = editorContent._editor.instance;
        console.log('Editor instance:', editor);
        console.log('Editor state:', editor.state);

        if (editor.state) {
          // Use ProseMirror's HTML serializer
          const content = globalThis.ProseMirror.dom.serializeString(editor.state.doc);
          this.note.text = this.note.text || {};
          this.note.text.content = content;
          console.log('Captured ProseMirror content:', this.note.text.content);
        }
      } else {
        console.warn('No ProseMirror editor found in DOM');
      }
    }

    // Update the mode
    this._mode = toggle.checked ? MODES.EDIT : MODES.PLAY;

    // If we're leaving edit mode, save the captured content
    if (wasEditMode && this._mode === MODES.PLAY) {
      await NoteManager.updateNote(this.actor, this.note.key, {
        name: this.note.name,
        text: this.note.text
      });
      this._hasUnsavedChanges = false;
      ui.notifications.info(game.i18n.localize('sheet-notes.note.notifications.saved'));
    }

    // Update tooltip
    const label = game.i18n.localize(toggle.checked ? 'sheet-notes.common.view' : 'sheet-notes.common.edit');
    toggle.dataset.tooltip = label;
    toggle.setAttribute('aria-label', label);

    await this.render();
  }

  /** @override */
  async _onChangeForm(formConfig, event) {
    // Handle title changes
    if (event.target.name === 'name') {
      this.note.name = event.target.value;
      this._hasUnsavedChanges = true;
    }
  }


  /** @override */
  async _onRender(context, options) {
    super._onRender(context, options);

    // Add edit mode classes
    const html = this.element;
    html.classList.toggle('mode-edit', this.isEditMode);
    html.classList.toggle('mode-play', !this.isEditMode);

    // Add edit mode slider to header if not already present
    const header = html.querySelector('.window-header');
    if (this.isEditable && header && !header.querySelector('.mode-slider')) {
      const toggle = document.createElement('slide-toggle');
      toggle.checked = this._mode === this.constructor.MODES.EDIT;
      toggle.classList.add('mode-slider');
      toggle.dataset.tooltip = game.i18n.localize(toggle.checked ? 'sheet-notes.common.view' : 'sheet-notes.common.edit');
      toggle.setAttribute('aria-label', game.i18n.localize(toggle.checked ? 'sheet-notes.common.view' : 'sheet-notes.common.edit'));
      toggle.addEventListener('change', this._onChangeSheetMode.bind(this));
      toggle.addEventListener('dblclick', event => event.stopPropagation());
      header.insertAdjacentElement('afterbegin', toggle);
    }

    // Activate ProseMirror editors if in edit mode
    if (this.isEditMode) {
      await this._activateProseMirror();

      // Since appendChild error happens, manually attach save handler to button
      setTimeout(() => {
        const saveButton = html.querySelector('.editor-menu button[data-action="save"]');
        if (saveButton) {
          console.log('Found save button, adding click handler');
          saveButton.addEventListener('click', async event => {
            event.preventDefault();
            console.log('Save button clicked via manual handler');
            // Call our save logic directly
            await this._handleSave();
          });
        }
      }, 100);
    }

    // If we have unsaved changes, mark the window
    if (this._hasUnsavedChanges) {
      html.querySelector('.window-title').classList.add('unsaved');
    }
  }

  /**
   * Activate ProseMirror editors
   * @protected
   */
  async _activateProseMirror() {
    const proseMirrorElements = this.element.querySelectorAll('prose-mirror');
    console.log('Found prose-mirror elements:', proseMirrorElements.length);
    for (const element of proseMirrorElements) {
      const name = element.getAttribute('name');
      console.log('Activating editor for:', name);
      console.log('Expected editorTarget:', this.editorTarget);
      if (!name) continue;

      // Activate the editor with ProseMirror configuration
      await this.activateEditor(name, {
        engine: 'prosemirror',
        collaborate: false,
        plugins: {
          menu: globalThis.ProseMirror.ProseMirrorMenu.build(globalThis.ProseMirror.defaultSchema, {
            compact: true,
            destroyOnSave: false,
            onSave: async () => {
              console.log('ProseMirror save button clicked!');
              // Get the editor content directly from the DOM
              const editorContent = this.element.querySelector('prose-mirror.editor-content');
              if (editorContent?._editor?.instance) {
                const editor = editorContent._editor.instance;
                if (editor.state) {
                  // Use ProseMirror's HTML serializer
                  const content = globalThis.ProseMirror.dom.serializeString(editor.state.doc);
                  this.note.text = this.note.text || {};
                  this.note.text.content = content;
                }
              } else if (editorContent) {
                // Fallback - look for ProseMirror content div
                const pmContent = editorContent.querySelector('.ProseMirror');
                if (pmContent) {
                  let content = pmContent.innerHTML;
                  // Remove ProseMirror trailing break elements
                  content = content.replace(/<br\s+class="ProseMirror-trailingBreak">/g, '');
                  this.note.text = this.note.text || {};
                  this.note.text.content = content;
                }
              }

              // Save immediately
              await NoteManager.updateNote(this.actor, this.note.key, {
                name: this.note.name,
                text: this.note.text
              });

              this._hasUnsavedChanges = false;
              ui.notifications.info(game.i18n.localize('sheet-notes.note.notifications.saved'));

              // Switch back to view mode
              this._mode = this.constructor.MODES.PLAY;

              // Update the slider
              const toggle = this.element.querySelector('.window-header .mode-slider');
              if (toggle) {
                toggle.checked = false;
                const label = game.i18n.localize('sheet-notes.common.edit');
                toggle.dataset.tooltip = label;
                toggle.setAttribute('aria-label', label);
              }

              // Re-render to show view mode
              await this.render();
            }
          })
        }
      }, element.getAttribute('value') || '');
    }
  }

  /**
   * Activate an editor instance
   * @param {string} name - The editor name
   * @param {object} options - Editor options
   * @param {string} initialContent - Initial content
   */
  async activateEditor(name, options = {}, initialContent = '') {
    console.log('activateEditor called with name:', name);
    // Store editors map
    this._editors = this._editors || {};
    // Find the prose-mirror element
    const element = this.element.querySelector(`prose-mirror[name="${name}"]`);
    if (!element) return null;

    // Get the initial content
    const content = initialContent || element.innerHTML || '';

    try {
      // Create the editor HTML
      const editorHtml = await TextEditor.create({
        ...options,
        target: name,
        content: content,
        save_callback: () => {
          this._hasUnsavedChanges = true;
        }
      });

      // Create a container div
      const container = document.createElement('div');
      container.innerHTML = editorHtml;
      const editorElement = container.firstElementChild;

      // Replace the prose-mirror element
      element.parentNode.replaceChild(editorElement, element);

      // Activate the editor after it's in the DOM
      const contentDiv = editorElement.querySelector('.editor-content[data-edit]');
      if (contentDiv) {
        await TextEditor.activateListeners(editorElement);
        console.log('About to store editor with name:', name);
        this._editors[name] = editorElement;
        console.log('Editor activated and stored:', name);
        console.log('All stored editors:', Object.keys(this._editors));
        console.log('Editor element structure:', editorElement);
        console.log('Content div:', contentDiv);
        console.log('Content div _editor after activation:', contentDiv._editor);
      } else {
        console.warn('No content div with data-edit found in editor element');
      }

      return editorElement;
    } catch (error) {
      console.error('Error creating editor:', error);
      // If TextEditor.create fails, try a simpler approach
      // Just store a reference to the element so we can extract content later
      this._editors[name] = element;

      // Try to activate it differently - directly on the prose-mirror element
      element.classList.add('editor-content');
      element.setAttribute('data-edit', name);

      // Store the content for later retrieval
      element._content = content;

      return element;
    }
  }

  /**
   * Save an editor's content
   * @param {string} name - The editor name
   * @param {object} options - Save options
   */
  async saveEditor(name, options = {}) {
    console.log('saveEditor called for:', name);
    const editorElement = this._editors?.[name];
    if (!editorElement) {
      console.warn('No editor element found for:', name);
      return;
    }

    // Find the editor content element
    const contentElement = editorElement.querySelector('.editor-content');
    if (!contentElement) {
      console.warn('No content element found in editor');
      return;
    }

    // Get the editor instance
    const editor = contentElement._editor;
    if (!editor) {
      console.warn('No _editor property on content element');
      return;
    }

    // Get the HTML content from the editor
    let content;
    if (editor.mce) {
      content = editor.mce.getContent();
    } else if (editor.instance) {
      // ProseMirror - get HTML from the state
      const state = editor.instance.state;
      const fragment = globalThis.DOMParser.prototype.parseFromString(
        `<div>${globalThis.ProseMirror.dom.serializeString(state.doc)}</div>`,
        'text/html'
      ).body.firstChild;
      content = fragment.innerHTML;
    } else {
      console.warn('No editor instance found (neither mce nor instance)');
    }

    console.log('Extracted content:', content);

    // Update our note object
    this.note.text = this.note.text || {};
    this.note.text.content = content || '';

    // Save to the actor
    await NoteManager.updateNote(this.actor, this.note.key, {
      name: this.note.name,
      text: this.note.text
    });

    this._hasUnsavedChanges = false;

    if (!options.remove) {
      ui.notifications.info(game.i18n.localize('sheet-notes.note.notifications.saved'));
    }
  }

  /** @override */
  async close(options = {}) {
    // Auto-save any pending changes before closing
    if (this.isEditMode && this._hasUnsavedChanges) {
      await this.#save();
    }

    return super.close(options);
  }

  /**
   * Save the note
   * @private
   */
  async #save() {
    console.log('#save called, _editors:', this._editors, 'editorTarget:', this.editorTarget);
    // Get the current content from the editor
    if (this._editors) {
      const editorName = this.editorTarget;
      const editor = this._editors[editorName];
      if (editor) {
        // Save the editor content
        await this.saveEditor(editorName);
        return; // saveEditor will handle the update
      }
    }
    console.log('No editors found, falling back to direct save');

    // Update the note
    await NoteManager.updateNote(this.actor, this.note.key, {
      name: this.note.name,
      text: this.note.text
    });

    this._hasUnsavedChanges = false;
    ui.notifications.info(game.i18n.localize('sheet-notes.note.notifications.saved'));
  }

  /**
   * Handle save button click
   * @private
   */
  async _handleSave() {
    console.log('_handleSave called');

    // Get the editor content directly from the DOM
    const editorContent = this.element.querySelector('prose-mirror.editor-content');
    if (editorContent) {
      // Look for the ProseMirror content area within the editor
      const pmContent = editorContent.querySelector('.ProseMirror');

      if (pmContent) {
        // Get just the content, not the UI
        let content = pmContent.innerHTML;
        // Remove ProseMirror trailing break elements
        content = content.replace(/<br\s+class="ProseMirror-trailingBreak">/g, '');
        this.note.text = this.note.text || {};
        this.note.text.content = content;
      }
    }

    // Save immediately
    await NoteManager.updateNote(this.actor, this.note.key, {
      name: this.note.name,
      text: this.note.text
    });

    this._hasUnsavedChanges = false;
    ui.notifications.info(game.i18n.localize('sheet-notes.note.notifications.saved'));

    // Switch back to view mode
    this._mode = this.constructor.MODES.PLAY;

    // Update the slider
    const toggle = this.element.querySelector('.window-header .mode-slider');
    if (toggle) {
      toggle.checked = false;
      const label = game.i18n.localize('sheet-notes.common.edit');
      toggle.dataset.tooltip = label;
      toggle.setAttribute('aria-label', label);
    }

    // Re-render to show view mode
    await this.render();
  }

  /**
   * Show the note viewer
   * @param {Actor} actor - The actor that owns the note
   * @param {string} noteKey - The key of the note to show
   * @returns {Promise<NoteViewer>}
   */
  static async show(actor, noteKey) {
    const note = NoteManager.getNote(actor, noteKey);
    if (!note) {
      ui.notifications.error(game.i18n.localize('sheet-notes.note.errors.not-found'));
      return null;
    }

    const viewer = new NoteViewer(actor, note);
    await viewer.render(true);
    return viewer;
  }
}
