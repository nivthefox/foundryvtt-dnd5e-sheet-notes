/**
 * Custom item sheet for Note items
 */
export class NoteSheet extends dnd5e.applications.item.ItemSheet5e2 {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['dnd5e2', 'sheet', 'item', 'dnd5e-sheet-notes'],
      resizable: true,
      width: 600
    });
  }

  get template() {
    return 'modules/dnd5e-sheet-notes/templates/note_sheet.hbs';
  }
}
