/**
 * Data model for Note items
 */
export class NoteModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.SchemaField({
        value: new fields.HTMLField({
          initial: "",
          blank: true
        })
      }),
      category: new fields.StringField({
        initial: "",
        blank: true
      })
    };
  }
}