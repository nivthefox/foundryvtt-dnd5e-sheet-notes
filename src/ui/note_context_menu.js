/**
 * Context Menu System for Notes
 * Handles right-click and ellipsis button context menus for note items
 */

export class NoteContextMenu {
  static documentClickHandler = null;

  /**
   * Initialize context menu event listeners for a container
   * @param {HTMLElement} container - The container element to add listeners to
   * @param {ActorSheet5e} sheet - The sheet application instance
   */
  static initialize(container, sheet) {
    container.addEventListener('contextmenu', event => {
      const noteItem = event.target.closest('.item[data-note-key]');
      if (noteItem) {
        event.preventDefault();
        event.stopPropagation();
        this.showContextMenu(event, noteItem, sheet);
      }
    });

    container.addEventListener('click', event => {
      if (event.target.closest('[data-context-menu]')) {
        event.preventDefault();
        event.stopPropagation();
        const noteItem = event.target.closest('.item[data-note-key]');
        if (noteItem) {
          this.showContextMenu(event, noteItem, sheet);
        }
      }
    });

    if (!this.documentClickHandler) {
      this.documentClickHandler = event => {
        if (!event.target.closest('#context-menu')) {
          this.closeContextMenu();
        }
      };
      document.addEventListener('click', this.documentClickHandler);
    }
  }

  /**
   * Show the context menu for a note item
   * @param {Event} event - The triggering event
   * @param {HTMLElement} noteItem - The note item element
   * @param {ActorSheet5e} sheet - The sheet application instance
   */
  static showContextMenu(event, noteItem, sheet) {
    this.closeContextMenu();

    const noteKey = noteItem.dataset.noteKey;
    const actor = sheet.actor;
    const note = actor.items.get(noteKey);

    if (!note) return;

    const contextMenu = this.createContextMenuElement(note, sheet);

    this.positionContextMenu(contextMenu, event);

    document.body.appendChild(contextMenu);

    this.activeContextMenu = contextMenu;
  }

  /**
   * Create the context menu DOM element
   * @param {Item5e} note - The note item
   * @param {ActorSheet5e} sheet - The sheet application instance
   * @returns {HTMLElement} The context menu element
   */
  static createContextMenuElement(note, sheet) {
    const menu = document.createElement('nav');
    menu.id = 'context-menu';
    menu.className = 'dnd5e2 expand-down';

    const contextItems = document.createElement('ol');
    contextItems.className = 'context-items';

    contextItems.appendChild(this.createContextItem(
      'fas fa-eye fa-fw',
      'View Note',
      () => this.viewNote(note)
    ));

    if (sheet.isEditable) {
      contextItems.appendChild(this.createContextItem(
        'fas fa-edit fa-fw',
        'Edit',
        () => this.editNote(note)
      ));

      contextItems.appendChild(this.createContextItem(
        'fas fa-copy fa-fw',
        'Duplicate',
        () => this.duplicateNote(note, sheet.actor)
      ));

      contextItems.appendChild(this.createContextItem(
        'fas fa-trash fa-fw',
        'Delete',
        () => this.deleteNote(note, sheet.actor)
      ));
    }



    menu.appendChild(contextItems);
    return menu;
  }

  /**
   * Create a context menu item
   * @param {string} iconClass - CSS classes for the icon
   * @param {string} text - Display text
   * @param {Function} callback - Click handler
   * @returns {HTMLElement} The context item element
   */
  static createContextItem(iconClass, text, callback) {
    const item = document.createElement('li');
    item.className = 'context-item';

    const icon = document.createElement('i');
    icon.className = iconClass;

    item.appendChild(icon);
    item.appendChild(document.createTextNode(text));

    item.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      callback();
      this.closeContextMenu();
    });

    return item;
  }

  /**
   * Position the context menu relative to the event
   * @param {HTMLElement} menu - The context menu element
   * @param {Event} event - The triggering event
   */
  static positionContextMenu(menu, event) {
    let x = event.clientX;
    let y = event.clientY;

    const menuRect = { width: 200, height: 250 }; // Approximate menu size
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    if (x + menuRect.width > viewport.width) {
      x = viewport.width - menuRect.width - 10;
    }
    if (y + menuRect.height > viewport.height) {
      y = viewport.height - menuRect.height - 10;
    }

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  /**
   * Close any active context menu
   */
  static closeContextMenu() {
    if (this.activeContextMenu) {
      this.activeContextMenu.remove();
      this.activeContextMenu = null;
    }
  }

  /**
   * View a note (read-only)
   * @param {Item5e} note - The note item
   */
  static viewNote(note) {
    note.sheet.render(true, { editable: false });
  }

  /**
   * Edit a note
   * @param {Item5e} note - The note item
   */
  static editNote(note) {
    note.sheet.render(true);
  }

  /**
   * Duplicate a note
   * @param {Item5e} note - The note item
   * @param {Actor5e} actor - The actor that owns the note
   */
  static async duplicateNote(note, actor) {
    const noteData = note.toObject();
    noteData.name = `${noteData.name} (Copy)`;
    delete noteData._id;

    await actor.createEmbeddedDocuments('Item', [noteData]);
    ui.notifications.info(`Duplicated note: ${note.name}`);
  }

  /**
   * Delete a note with confirmation
   * @param {Item5e} note - The note item
   * @param {Actor5e} actor - The actor that owns the note
   */
  static async deleteNote(note, actor) {
    const confirmed = await Dialog.confirm({
      title: `Delete Note: ${note.name}`,
      content: `<p>Are you sure you want to delete the note "${note.name}"?</p><p>This action cannot be undone.</p>`,
      defaultYes: false
    });

    if (confirmed) {
      await note.delete();
      ui.notifications.info(`Deleted note: ${note.name}`);
    }
  }

  /**
   * Display note content in chat
   * @param {Item5e} note - The note item
   */
  static async displayInChat(note) {
    const content = note.system.description?.value || '';

    await ChatMessage.create({
      user: game.user.id,
      content: `<div class="dnd5e chat-card">
        <header class="card-header">
          <img src="${note.img}" alt="${note.name}" width="36" height="36"/>
          <h3>${note.name}</h3>
        </header>
        <div class="card-content">
          ${content || '<em>(Empty note)</em>'}
        </div>
      </div>`,
      speaker: ChatMessage.getSpeaker({ actor: note.parent })
    });
  }

  /**
   * Toggle favorite status of a note
   * @param {Item5e} note - The note item
   */
  static async toggleFavorite(note) {
    const currentFavorite = note.getFlag('dnd5e-sheet-notes', 'favorite') === true;
    await note.setFlag('dnd5e-sheet-notes', 'favorite', !currentFavorite);

    const action = currentFavorite ? 'removed from' : 'added to';
    ui.notifications.info(`Note "${note.name}" ${action} favorites`);
  }
}
