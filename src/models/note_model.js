import { Category } from '../entities/category.js';

/**
 * Data model for Note items extending Foundry's DataModel
 */
export class NoteModel extends foundry.abstract.DataModel {
  /**
   * Define the data schema for Note items
   * @returns {Object} The schema definition
   */
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
   * Get favorite data for this note
   * @returns {Object} FavoriteData5e object for favorites system
   */
  getFavoriteData() {
    let subtitle = game.i18n.localize('dnd5e-sheet-notes.type.note');

    if (this.category) {
      const category = Category.fromActor(this.parent.parent, this.category);
      if (category) {
        subtitle = category.name;
      }
    }

    return {
      img: this.parent.img,
      title: this.parent.name,
      subtitle: subtitle
    };
  }

  /**
   * Configure the Note item type settings
   */
  static setup() {
    if (!CONFIG.DND5E.defaultArtwork.Item) {
      CONFIG.DND5E.defaultArtwork.Item = {};
    }
    CONFIG.DND5E.defaultArtwork.Item['dnd5e-sheet-notes.note'] = 'modules/dnd5e-sheet-notes/public/note.svg';
  }
}
