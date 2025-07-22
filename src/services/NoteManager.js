/**
 * NoteManager - Service for managing note CRUD operations on actors
 */

import { id as MODULE_ID } from '../../module.json';
import { Note } from '../models/Note.js';

export class NoteManager {
  static FLAG_KEY = 'notes';

  /**
   * Create a new note on the actor
   * @param {Actor} actor - The actor to add the note to
   * @param {Object} noteData - Note data
   * @returns {Promise<Note>} - The created note
   */
  static async createNote(actor, noteData = {}) {
    if (!actor) throw new Error('Actor must be provided');

    // Get existing notes (or initialize empty array)
    const notes = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];

    // Calculate sort value if not provided
    if (noteData.sort === undefined) {
      const maxSort = notes.reduce((max, note) => Math.max(max, note.sort || 0), 0);
      noteData.sort = maxSort + 1;
    }

    // Create note instance
    const note = new Note(noteData);

    // Add to notes array
    notes.push(note.toObject());

    // Save to actor
    await actor.setFlag(MODULE_ID, this.FLAG_KEY, notes);

    return note;
  }

  /**
   * Get a specific note by key
   * @param {Actor} actor - The actor to get the note from
   * @param {string} noteKey - The note key
   * @returns {Note|null} - The note or null if not found
   */
  static getNote(actor, noteKey) {
    if (!actor) throw new Error('Actor must be provided');
    if (!noteKey) throw new Error('Note key must be provided');

    const notes = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];
    const noteData = notes.find(n => n.key === noteKey);

    return noteData ? new Note(noteData) : null;
  }

  /**
   * Get all notes for an actor
   * @param {Actor} actor - The actor to get notes from
   * @returns {Array<Object>} - Array of note data objects
   */
  static getAllNotes(actor) {
    if (!actor) throw new Error('Actor must be provided');

    return actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];
  }

  /**
   * Get count of notes for an actor
   * @param {Actor} actor - The actor to count notes for
   * @returns {number} - Number of notes
   */
  static getNoteCount(actor) {
    return this.getAllNotes(actor).length;
  }

  /**
   * Update an existing note
   * @param {Actor} actor - The actor with the note
   * @param {string} noteKey - The note key
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Note>} - The updated note
   */
  static async updateNote(actor, noteKey, updates) {
    if (!actor) throw new Error('Actor must be provided');
    if (!noteKey) throw new Error('Note key must be provided');

    const notes = this.getAllNotes(actor);
    const noteIndex = notes.findIndex(n => n.key === noteKey);

    if (noteIndex === -1) {
      throw new Error(`Note with key ${noteKey} not found`);
    }

    // Create Note instance from existing data
    const note = new Note(notes[noteIndex]);

    // Apply updates
    note.update(updates);

    // Replace in array
    notes[noteIndex] = note.toObject();

    // Save to actor
    await actor.setFlag(MODULE_ID, this.FLAG_KEY, notes);

    return note;
  }

  /**
   * Delete a note
   * @param {Actor} actor - The actor with the note
   * @param {string} noteKey - The note key to delete
   * @returns {Promise<void>}
   */
  static async deleteNote(actor, noteKey) {
    if (!actor) throw new Error('Actor must be provided');
    if (!noteKey) throw new Error('Note key must be provided');

    const notes = this.getAllNotes(actor);
    const filteredNotes = notes.filter(n => n.key !== noteKey);

    if (filteredNotes.length === notes.length) {
      throw new Error(`Note with key ${noteKey} not found`);
    }

    await actor.setFlag(MODULE_ID, this.FLAG_KEY, filteredNotes);
  }

  /**
   * Delete all notes from an actor
   * @param {Actor} actor - The actor to clear notes from
   * @returns {Promise<void>}
   */
  static async deleteAllNotes(actor) {
    if (!actor) throw new Error('Actor must be provided');

    await actor.setFlag(MODULE_ID, this.FLAG_KEY, []);
  }

  /**
   * Create a note from a JournalEntryPage
   * @param {Actor} actor - The actor to add the note to
   * @param {JournalEntryPage} journalEntryPage - The page to convert
   * @returns {Promise<Note>} - The created note
   */
  static async createNoteFromJournalPage(actor, journalEntryPage) {
    if (!actor) throw new Error('Actor must be provided');
    if (!journalEntryPage) throw new Error('JournalEntryPage must be provided');

    const note = Note.fromJournalEntryPage(journalEntryPage);
    const notes = this.getAllNotes(actor);

    notes.push(note.toObject());
    await actor.setFlag(MODULE_ID, this.FLAG_KEY, notes);

    return note;
  }

  /**
   * Export a note to a JournalEntryPage
   * @param {Actor} actor - The actor with the note
   * @param {string} noteKey - The note key to export
   * @param {JournalEntry} journal - The journal to add the page to
   * @returns {Promise<JournalEntryPage>} - The created page
   */
  static async exportNoteToJournalPage(actor, noteKey, journal) {
    if (!actor) throw new Error('Actor must be provided');
    if (!noteKey) throw new Error('Note key must be provided');
    if (!journal) throw new Error('JournalEntry must be provided');

    const note = this.getNote(actor, noteKey);
    if (!note) {
      throw new Error(`Note with key ${noteKey} not found`);
    }

    return await note.toJournalEntryPage(journal);
  }

  /**
   * Reorder notes by updating their sort values
   * @param {Actor} actor - The actor with the notes
   * @param {Array<string>} noteKeys - Array of note keys in desired order
   * @returns {Promise<void>}
   */
  static async reorderNotes(actor, noteKeys) {
    if (!actor) throw new Error('Actor must be provided');
    if (!Array.isArray(noteKeys)) throw new Error('Note keys must be an array');

    const notes = this.getAllNotes(actor);
    const notesMap = new Map(notes.map(n => [n.key, n]));

    // Verify all keys exist
    for (const key of noteKeys) {
      if (!notesMap.has(key)) {
        throw new Error(`Note with key ${key} not found`);
      }
    }

    // Update sort values starting from 1
    let sortValue = 1;
    for (const key of noteKeys) {
      const note = notesMap.get(key);
      note.sort = sortValue;
      sortValue += 1;
    }

    // Handle any notes not in the reorder list
    const unorderedNotes = notes.filter(n => !noteKeys.includes(n.key));
    for (const note of unorderedNotes) {
      note.sort = sortValue;
      sortValue += 1;
    }

    await actor.setFlag(MODULE_ID, this.FLAG_KEY, notes);
  }

  /**
   * Validate and clean up orphaned category references in notes
   * @param {Actor} actor - The actor to validate notes for
   * @returns {Promise<number>} - Number of notes cleaned
   */
  static async validateCategoryReferences(actor) {
    if (!actor) throw new Error('Actor must be provided');

    const notes = this.getAllNotes(actor);
    const categories = actor.getFlag(MODULE_ID, 'categories') || [];
    const validCategoryKeys = new Set(categories.map(c => c.key));

    let cleanedCount = 0;
    let hasChanges = false;

    for (const note of notes) {
      const categoryKey = note.flags?.[MODULE_ID]?.category;

      // If note has a category reference that doesn't exist, set it to null
      if (categoryKey && !validCategoryKeys.has(categoryKey)) {
        if (!note.flags) note.flags = {};
        if (!note.flags[MODULE_ID]) note.flags[MODULE_ID] = {};
        note.flags[MODULE_ID].category = null;
        cleanedCount++;
        hasChanges = true;
      }
    }

    // Save changes if any were made
    if (hasChanges) {
      await actor.setFlag(MODULE_ID, this.FLAG_KEY, notes);
    }

    return cleanedCount;
  }
}

