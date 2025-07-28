/**
 * Core migration system for 5e Sheet Notes
 */

import { id as MODULE_ID } from '../../module.json';
import { migrateToV1 } from './v1.js';

/**
 * Current migration version
 */
export const MIGRATION_VERSION = 1;

/**
 * Available migrations
 */
const MIGRATIONS = {
  1: migrateToV1
};

/**
 * Run any needed migrations for the actor's notes data
 * @param {Actor} actor - The actor to migrate
 * @returns {Promise<void>}
 */
export async function runMigrations(actor) {
  if (!actor) throw new Error('Actor must be provided');

  const currentVersion = actor.getFlag(MODULE_ID, 'version');

  if (currentVersion !== undefined && currentVersion >= MIGRATION_VERSION) {
    return;
  }

  const hasAnyNotes = actor.items.some(item => item.type === 'dnd5e-sheet-notes.note');
  const hasCategories = (actor.getFlag(MODULE_ID, 'categories') || []).length > 0;

  if (currentVersion === undefined && !hasAnyNotes && !hasCategories) {
    await actor.setFlag(MODULE_ID, 'version', MIGRATION_VERSION);
    return;
  }

  const startVersion = currentVersion || 0;

  for (let version = startVersion + 1; version <= MIGRATION_VERSION; version++) {
    if (MIGRATIONS[version]) {
      await MIGRATIONS[version](actor);
    }
  }

  await actor.setFlag(MODULE_ID, 'version', MIGRATION_VERSION);
}
