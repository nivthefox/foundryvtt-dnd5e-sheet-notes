/**
 * Type definitions for 5e Sheet Notes & Trackers
 * @module types
 */

/**
 * @typedef {Object} NoteData
 * @property {string} id - Unique identifier
 * @property {string} actorId - Associated actor ID
 * @property {string} journalId - Associated JournalEntry ID
 * @property {string} [category] - Category ID
 * @property {number} [order] - Sort order
 */

/**
 * @typedef {Object} TrackerData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {'string'|'number'|'enumeration'} dataType - Tracker type
 * @property {string|number} value - Current value
 * @property {number} [min] - Minimum value (number type)
 * @property {number} [max] - Maximum value (number type)
 * @property {number} [step] - Step value (number type)
 * @property {string[]} [options] - Available options (enumeration type)
 * @property {string} [category] - Category ID
 * @property {number} [order] - Sort order
 */

/**
 * @typedef {Object} CategoryData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} [description] - Category description
 * @property {boolean} [collapsed] - Whether category is collapsed
 * @property {number} [order] - Sort order
 */

export {};