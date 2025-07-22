/**
 * Note class for managing note data structure and validation
 */

import { id as MODULE_ID } from '../../module.json';

export class Note {
  constructor(data = {}) {
    // Define default note structure
    const defaults = {
      key: foundry.utils.randomID(),
      name: 'New Note',
      sort: 100000,
      text: {
        content: '',
        format: 1,
        markdown: undefined
      },
      flags: {
        [MODULE_ID]: {
          category: null
        }
      },
      _stats: {
        createdTime: Date.now(),
        modifiedTime: Date.now(),
        lastModifiedBy: game.user.id
      }
    };

    // Merge provided data with defaults
    const noteData = foundry.utils.mergeObject(defaults, data);

    // Assign properties
    this.key = noteData.key;
    this.name = noteData.name;
    this.sort = noteData.sort;
    this.text = noteData.text;
    this.flags = noteData.flags;
    this._stats = noteData._stats;

    this.validate();
  }

  /**
   * Update note properties
   * @param {Object} updates - Properties to update
   * @returns {Note} - Returns this for chaining
   */
  update(updates) {
    // Prepare update data with modified timestamp
    const updateData = foundry.utils.mergeObject(updates, {
      _stats: {
        modifiedTime: Date.now(),
        lastModifiedBy: game.user.id
      }
    });

    // Merge updates into current data
    const currentData = this.toObject();
    const mergedData = foundry.utils.mergeObject(currentData, updateData);

    // Update properties
    this.name = mergedData.name;
    this.sort = mergedData.sort;
    this.text = mergedData.text;
    this.flags = mergedData.flags;
    this._stats = mergedData._stats;

    this.validate();
    return this;
  }

  /**
   * Export note data for storage
   * @returns {Object} - Plain object for storage
   */
  toObject() {
    const obj = {
      key: this.key,
      name: this.name,
      sort: this.sort,
      text: {
        content: this.text.content,
        format: this.text.format
      },
      flags: this.flags,
      _stats: this._stats
    };

    // Only include markdown if present
    if (this.text.markdown !== undefined) {
      obj.text.markdown = this.text.markdown;
    }

    return obj;
  }

  /**
   * Create a copy of this note
   * @returns {Note} - New Note instance
   */
  clone() {
    const data = this.toObject();
    data.key = foundry.utils.randomID();
    data._stats = {
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: game.user.id
    };
    return new Note(data);
  }

  /**
   * Validate note data
   * @throws {Error} - If validation fails
   */
  validate() {
    if (!this.key || typeof this.key !== 'string') {
      throw new Error('Note key must be a non-empty string');
    }
    if (!this.name || typeof this.name !== 'string') {
      throw new Error('Note name must be a non-empty string');
    }
    if (typeof this.sort !== 'number') {
      throw new Error('Note sort must be a number');
    }
    if (!this.text || typeof this.text !== 'object') {
      throw new Error('Note text must be an object');
    }
    if (typeof this.text.content !== 'string') {
      throw new Error('Note text.content must be a string');
    }
    if (this.text.format !== 1 && this.text.format !== 2) {
      throw new Error('Note text.format must be 1 (HTML) or 2 (Markdown)');
    }
    if (!this._stats || typeof this._stats !== 'object') {
      throw new Error('Note _stats must be an object');
    }
  }

  /**
   * Convert note to JournalEntryPage document
   * @param {JournalEntry} journal - Parent journal entry
   * @returns {Promise<JournalEntryPage>} - Created JournalEntryPage document
   */
  async toJournalEntryPage(journal) {
    if (!journal || !(journal instanceof JournalEntry)) {
      throw new Error('A valid JournalEntry must be provided');
    }

    const pageData = {
      name: this.name,
      type: 'text',
      text: {
        content: this.text.content,
        format: this.text.format
      },
      sort: this.sort,
      flags: foundry.utils.deepClone(this.flags)
    };

    if (this.text.markdown !== undefined) {
      pageData.text.markdown = this.text.markdown;
    }

    // Create the page in the journal
    const page = await journal.createEmbeddedDocuments('JournalEntryPage', [pageData]);
    return page[0];
  }

  /**
   * Create a Note from a JournalEntryPage document
   * @param {JournalEntryPage} page - JournalEntryPage document
   * @returns {Note} - New Note instance
   */
  static fromJournalEntryPage(page) {
    if (!page || !(page instanceof JournalEntryPage)) {
      throw new Error('A valid JournalEntryPage must be provided');
    }

    const noteData = {
      key: foundry.utils.randomID(),
      name: page.name || 'Untitled',
      sort: page.sort || 100000,
      text: {
        content: page.text?.content || '',
        format: page.text?.format || 1
      },
      flags: {
        [MODULE_ID]: {
          category: null,
          sourcePageUuid: page.uuid
        }
      },
      _stats: {
        createdTime: Date.now(),
        modifiedTime: Date.now(),
        lastModifiedBy: game.user.id
      }
    };

    // Include markdown if present
    if (page.text?.markdown !== undefined) {
      noteData.text.markdown = page.text.markdown;
    }

    // Merge any existing flags
    if (page.flags) {
      noteData.flags = foundry.utils.mergeObject(noteData.flags, page.flags);
    }

    return new Note(noteData);
  }
}

