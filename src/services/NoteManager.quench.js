/**
 * Quench unit tests for NoteManager class
 */

import { NoteManager } from './NoteManager.js';
import { Note } from '../models/Note.js';
import { id as MODULE_ID } from '../../module.json';

export function registerNoteManagerTests() {
  Hooks.on('quenchReady', quench => {
    quench.registerBatch(
      'dnd5e-sheet-notes.models.notemanager',
      context => {
        const { describe, it, assert, beforeEach, afterEach } = context;

        describe('NoteManager CRUD Operations', function() {
          let mockActor;

          beforeEach(function() {
            // Create mock actor
            mockActor = {
              id: 'test-actor-id',
              name: 'Test Actor',
              flags: {},
              getFlag: function(scope, key) {
                return this.flags[scope]?.[key];
              },
              setFlag: async function(scope, key, value) {
                if (!this.flags[scope]) this.flags[scope] = {};
                this.flags[scope][key] = value;
                return Promise.resolve();
              }
            };
          });

          afterEach(function() {
            mockActor = null;
          });

          describe('Initialization', function() {
            it('should auto-initialize empty notes array on first create', async function() {
              // Should start with no notes
              assert.isUndefined(mockActor.getFlag(MODULE_ID, 'notes'));

              // Create first note
              await NoteManager.createNote(mockActor);

              // Should now have initialized array
              const notes = mockActor.getFlag(MODULE_ID, 'notes');
              assert.isArray(notes);
              assert.equal(notes.length, 1);
            });

            it('should not overwrite existing notes on create', async function() {
              // Set existing notes
              await mockActor.setFlag(MODULE_ID, 'notes', [{ key: 'existing' }]);

              // Create new note
              await NoteManager.createNote(mockActor, { name: 'New Note' });

              const notes = mockActor.getFlag(MODULE_ID, 'notes');
              assert.equal(notes.length, 2);
              assert.equal(notes[0].key, 'existing');
              assert.equal(notes[1].name, 'New Note');
            });
          });

          describe('Create Note', function() {
            beforeEach(function() {
              // No initialization needed - will auto-init on first create
            });

            it('should create a new note with defaults', async function() {
              const note = await NoteManager.createNote(mockActor);

              assert.instanceOf(note, Note);
              assert.equal(note.name, 'New Note');
              assert.equal(note.sort, 1);

              const notes = NoteManager.getAllNotes(mockActor);
              assert.equal(notes.length, 1);
            });

            it('should create note with provided data', async function() {
              const noteData = {
                name: 'Custom Note',
                text: { content: '<p>Custom content</p>' }
              };

              const note = await NoteManager.createNote(mockActor, noteData);

              assert.equal(note.name, 'Custom Note');
              assert.equal(note.text.content, '<p>Custom content</p>');
            });

            it('should auto-increment sort value', async function() {
              await NoteManager.createNote(mockActor);
              await NoteManager.createNote(mockActor);
              const note3 = await NoteManager.createNote(mockActor);

              assert.equal(note3.sort, 3);
            });

            it('should respect provided sort value', async function() {
              const note = await NoteManager.createNote(mockActor, { sort: 50 });

              assert.equal(note.sort, 50);
            });
          });

          describe('Get Note', function() {
            let testNote;

            beforeEach(async function() {
              testNote = await NoteManager.createNote(mockActor, { name: 'Test Note' });
            });

            it('should retrieve note by key', function() {
              const retrieved = NoteManager.getNote(mockActor, testNote.key);

              assert.instanceOf(retrieved, Note);
              assert.equal(retrieved.key, testNote.key);
              assert.equal(retrieved.name, 'Test Note');
            });

            it('should return null for non-existent key', function() {
              const result = NoteManager.getNote(mockActor, 'non-existent');

              assert.isNull(result);
            });

            it('should throw error if key not provided', function() {
              assert.throws(() => {
                NoteManager.getNote(mockActor, null);
              }, 'Note key must be provided');
            });
          });

          describe('Get All Notes', function() {
            it('should return empty array when no notes', function() {
              const notes = NoteManager.getAllNotes(mockActor);

              assert.isArray(notes);
              assert.equal(notes.length, 0);
            });

            it('should return all notes as plain objects', async function() {
              await NoteManager.createNote(mockActor, { name: 'Note 1' });
              await NoteManager.createNote(mockActor, { name: 'Note 2' });

              const notes = NoteManager.getAllNotes(mockActor);

              assert.equal(notes.length, 2);
              assert.equal(notes[0].name, 'Note 1');
              assert.equal(notes[1].name, 'Note 2');
            });
          });

          describe('Update Note', function() {
            let testNote;

            beforeEach(async function() {
              testNote = await NoteManager.createNote(mockActor, {
                name: 'Original',
                text: { content: '<p>Original</p>' }
              });
            });

            it('should update note properties', async function() {
              const updated = await NoteManager.updateNote(mockActor, testNote.key, {
                name: 'Updated',
                text: { content: '<p>Updated</p>' }
              });

              assert.equal(updated.name, 'Updated');
              assert.equal(updated.text.content, '<p>Updated</p>');

              // Verify persistence
              const retrieved = NoteManager.getNote(mockActor, testNote.key);
              assert.equal(retrieved.name, 'Updated');
            });

            it('should throw error for non-existent note', async function() {
              try {
                await NoteManager.updateNote(mockActor, 'non-existent', { name: 'Fail' });
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.include(error.message, 'not found');
              }
            });
          });

          describe('Delete Note', function() {
            let testNote;

            beforeEach(async function() {
              testNote = await NoteManager.createNote(mockActor);
            });

            it('should delete note by key', async function() {
              await NoteManager.deleteNote(mockActor, testNote.key);

              const notes = NoteManager.getAllNotes(mockActor);
              assert.equal(notes.length, 0);

              const retrieved = NoteManager.getNote(mockActor, testNote.key);
              assert.isNull(retrieved);
            });

            it('should throw error for non-existent note', async function() {
              try {
                await NoteManager.deleteNote(mockActor, 'non-existent');
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.include(error.message, 'not found');
              }
            });
          });

          describe('Delete All Notes', function() {
            it('should clear all notes', async function() {
              await NoteManager.createNote(mockActor);
              await NoteManager.createNote(mockActor);
              await NoteManager.createNote(mockActor);

              await NoteManager.deleteAllNotes(mockActor);

              const notes = NoteManager.getAllNotes(mockActor);
              assert.equal(notes.length, 0);
            });
          });

          describe('Journal Page Conversion', function() {
            let mockJournalPage;
            let mockJournal;

            beforeEach(async function() {
              // Create mock journal page
              mockJournalPage = {
                uuid: 'JournalEntry.abc.JournalEntryPage.def',
                name: 'Test Page',
                type: 'text',
                sort: 50000,
                text: {
                  content: '<p>Page content</p>',
                  format: 1
                }
              };
              mockJournalPage.constructor = { name: 'JournalEntryPage' };
              Object.setPrototypeOf(mockJournalPage, JournalEntryPage.prototype);

              // Create mock journal
              mockJournal = {
                id: 'journal-id',
                createEmbeddedDocuments: async (type, data) => {
                  return data.map(d => ({ id: 'created-page', ...d }));
                }
              };
              mockJournal.constructor = { name: 'JournalEntry' };
              Object.setPrototypeOf(mockJournal, JournalEntry.prototype);
            });

            it('should create note from journal page', async function() {
              const note = await NoteManager.createNoteFromJournalPage(mockActor, mockJournalPage);

              assert.instanceOf(note, Note);
              assert.equal(note.name, 'Test Page');
              assert.equal(note.text.content, '<p>Page content</p>');
              assert.equal(note.flags[MODULE_ID].sourcePageUuid, mockJournalPage.uuid);

              const notes = NoteManager.getAllNotes(mockActor);
              assert.equal(notes.length, 1);
            });

            it('should export note to journal page', async function() {
              const note = await NoteManager.createNote(mockActor, {
                name: 'Export Test',
                text: { content: '<p>Export me</p>' }
              });

              const page = await NoteManager.exportNoteToJournalPage(
                mockActor,
                note.key,
                mockJournal
              );

              assert.equal(page.name, 'Export Test');
              assert.equal(page.text.content, '<p>Export me</p>');
            });
          });

          describe('Reorder Notes', function() {
            let note1; let note2; let note3;

            beforeEach(async function() {
              note1 = await NoteManager.createNote(mockActor, { name: 'Note 1' });
              note2 = await NoteManager.createNote(mockActor, { name: 'Note 2' });
              note3 = await NoteManager.createNote(mockActor, { name: 'Note 3' });
            });

            it('should reorder notes by key array', async function() {
              await NoteManager.reorderNotes(mockActor, [note3.key, note1.key, note2.key]);

              const notes = NoteManager.getAllNotes(mockActor);
              const note3Data = notes.find(n => n.key === note3.key);
              const note1Data = notes.find(n => n.key === note1.key);
              const note2Data = notes.find(n => n.key === note2.key);

              assert.equal(note3Data.sort, 1);
              assert.equal(note1Data.sort, 2);
              assert.equal(note2Data.sort, 3);
            });

            it('should handle partial reorder', async function() {
              await NoteManager.reorderNotes(mockActor, [note2.key, note3.key]);

              const notes = NoteManager.getAllNotes(mockActor);
              const note1Data = notes.find(n => n.key === note1.key);
              const note2Data = notes.find(n => n.key === note2.key);
              const note3Data = notes.find(n => n.key === note3.key);

              assert.equal(note2Data.sort, 1);
              assert.equal(note3Data.sort, 2);
              assert.equal(note1Data.sort, 3); // Unordered note comes last
            });

            it('should throw error for invalid key', async function() {
              try {
                await NoteManager.reorderNotes(mockActor, ['invalid-key']);
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.include(error.message, 'not found');
              }
            });
          });

          describe('Note Count', function() {
            it('should return correct count', async function() {
              assert.equal(NoteManager.getNoteCount(mockActor), 0);

              await NoteManager.createNote(mockActor);
              assert.equal(NoteManager.getNoteCount(mockActor), 1);

              await NoteManager.createNote(mockActor);
              await NoteManager.createNote(mockActor);
              assert.equal(NoteManager.getNoteCount(mockActor), 3);
            });
          });
        });
      },
      { displayName: 'DND5e Sheet Notes: NoteManager Service' }
    );
  });
}

