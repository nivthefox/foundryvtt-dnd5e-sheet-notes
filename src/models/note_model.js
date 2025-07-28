/**
 * Data model for Note items
 */
export class NoteModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.SchemaField({
        value: new fields.HTMLField({
          initial: '',
          blank: true
        })
      }),
      category: new fields.StringField({
        initial: '',
        blank: true
      })
    };
  }

  /**
   * Configure the Note item type settings
   */
  static setup() {
    // Set the default icon for Note items in creation dialogs
    if (!CONFIG.DND5E.defaultArtwork.Item) {
      CONFIG.DND5E.defaultArtwork.Item = {};
    }
    CONFIG.DND5E.defaultArtwork.Item["dnd5e-sheet-notes.note"] = "modules/dnd5e-sheet-notes/public/note.svg";
  }
}
