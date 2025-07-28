/**
 * Migration to version 1: Move uncategorized notes to default category
 */

import { id as MODULE_ID } from '../../module.json';

/**
 * Migration to version 1: Move uncategorized notes to default category
 * @param {Actor} actor - The actor to migrate
 * @returns {Promise<void>}
 */
export async function migrateToV1(actor) {
  const categories = actor.getFlag(MODULE_ID, 'categories') || [];
  const hasDefaultCategory = categories.some(c => c.name === 'Notes');

  if (!hasDefaultCategory) {
    const uncategorizedNotes = actor.items.filter(item =>
      item.type === 'dnd5e-sheet-notes.note'
      && (!item.system.category || item.system.category === '')
    );

    if (uncategorizedNotes.length > 0) {
      const defaultCategory = {
        key: foundry.utils.randomID(),
        name: 'Notes',
        ordering: 0,
        collapsed: false
      };

      categories.unshift(defaultCategory);
      await actor.setFlag(MODULE_ID, 'categories', categories);

      for (const note of uncategorizedNotes) {
        await note.update({ 'system.category': defaultCategory.key });
      }
    }
  }
}
