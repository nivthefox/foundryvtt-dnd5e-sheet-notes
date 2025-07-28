/**
 * Custom item sheet for Note items extending D&D 5e ItemSheet5e2
 */
export class NoteSheet extends dnd5e.applications.item.ItemSheet5e2 {

  /**
   * Default application options for the note sheet
   * @returns {Object} Merged default options
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['dnd5e2', 'sheet', 'item', 'dnd5e-sheet-notes'],
      resizable: true,
      width: 600
    });
  }

  /**
   * Path to the handlebars template for the note sheet
   * @returns {string} Template path
   */
  get template() {
    return 'modules/dnd5e-sheet-notes/templates/note_sheet.hbs';
  }
}
