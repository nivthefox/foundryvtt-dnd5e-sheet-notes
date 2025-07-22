/**
 * Quench unit tests for Note class
 */

import { Note } from './Note.js';
import { id as MODULE_ID } from '../../module.json';

export function registerNoteTests() {
  Hooks.on('quenchReady', quench => {
    quench.registerBatch(
      'dnd5e-sheet-notes.models.note',
      context => {
        const { describe, it, assert } = context;

        describe('Note Constructor', function() {
          it('should create note with default values', function() {
            const note = new Note();

            assert.isString(note.key);
            assert.equal(note.name, 'New Note');
            assert.equal(note.sort, 100000);
            assert.equal(note.text.content, '');
            assert.equal(note.text.format, 1);
            assert.isUndefined(note.text.markdown);
            assert.equal(note.flags[MODULE_ID].category, null);
            assert.isNumber(note._stats.createdTime);
            assert.isNumber(note._stats.modifiedTime);
            assert.equal(note._stats.lastModifiedBy, game.user.id);
          });

          it('should create note with provided data', function() {
            const data = {
              name: 'Test Note',
              sort: 200000,
              text: {
                content: '<p>Test content</p>',
                format: 1
              },
              flags: {
                [MODULE_ID]: {
                  category: 'test-category'
                }
              }
            };

            const note = new Note(data);

            assert.equal(note.name, 'Test Note');
            assert.equal(note.sort, 200000);
            assert.equal(note.text.content, '<p>Test content</p>');
            assert.equal(note.flags[MODULE_ID].category, 'test-category');
          });

          it('should preserve markdown when provided', function() {
            const data = {
              text: {
                content: '<p>Test</p>',
                format: 2,
                markdown: 'Test'
              }
            };

            const note = new Note(data);

            assert.equal(note.text.format, 2);
            assert.equal(note.text.markdown, 'Test');
          });

          it('should merge flags using foundry.utils.mergeObject', function() {
            const data = {
              flags: {
                [MODULE_ID]: {
                  category: 'test',
                  customField: 'value'
                },
                'other-module': {
                  data: 'preserved'
                }
              }
            };

            const note = new Note(data);

            assert.equal(note.flags[MODULE_ID].category, 'test');
            assert.equal(note.flags[MODULE_ID].customField, 'value');
            assert.equal(note.flags['other-module'].data, 'preserved');
          });
        });

        describe('Note Update', function() {
          let note;

          this.beforeEach(function() {
            note = new Note({
              name: 'Original',
              sort: 100000,
              text: { content: '<p>Original</p>', format: 1 }
            });
          });

          it('should update name', function() {
            const originalModified = note._stats.modifiedTime;

            // Small delay to ensure time difference
            setTimeout(() => {
              note.update({ name: 'Updated' });

              assert.equal(note.name, 'Updated');
              assert.isAbove(note._stats.modifiedTime, originalModified);
              assert.equal(note._stats.lastModifiedBy, game.user.id);
            }, 10);
          });

          it('should update text content', function() {
            note.update({
              text: {
                content: '<p>Updated content</p>'
              }
            });

            assert.equal(note.text.content, '<p>Updated content</p>');
            assert.equal(note.text.format, 1); // Should preserve format
          });

          it('should update multiple properties', function() {
            note.update({
              name: 'New Name',
              sort: 150000,
              text: {
                content: '<p>New content</p>',
                format: 2,
                markdown: 'New content'
              }
            });

            assert.equal(note.name, 'New Name');
            assert.equal(note.sort, 150000);
            assert.equal(note.text.content, '<p>New content</p>');
            assert.equal(note.text.format, 2);
            assert.equal(note.text.markdown, 'New content');
          });

          it('should merge flag updates', function() {
            note.update({
              flags: {
                [MODULE_ID]: {
                  category: 'updated-category'
                }
              }
            });

            assert.equal(note.flags[MODULE_ID].category, 'updated-category');
          });
        });

        describe('Note Validation', function() {
          it('should validate required fields', function() {
            assert.throws(() => {
              new Note({ key: null });
            }, 'Note key must be a non-empty string');

            assert.throws(() => {
              new Note({ name: '' });
            }, 'Note name must be a non-empty string');

            assert.throws(() => {
              new Note({ sort: 'not a number' });
            }, 'Note sort must be a number');
          });

          it('should validate text object', function() {
            assert.throws(() => {
              new Note({ text: null });
            }, 'Note text must be an object');

            assert.throws(() => {
              new Note({ text: { content: null } });
            }, 'Note text.content must be a string');

            assert.throws(() => {
              new Note({ text: { content: '', format: 3 } });
            }, 'Note text.format must be 1 (HTML) or 2 (Markdown)');
          });
        });

        describe('Note toObject', function() {
          it('should export basic note data', function() {
            const note = new Note({
              name: 'Export Test',
              text: { content: '<p>Content</p>', format: 1 }
            });

            const obj = note.toObject();

            assert.equal(obj.name, 'Export Test');
            assert.equal(obj.text.content, '<p>Content</p>');
            assert.equal(obj.text.format, 1);
            assert.isUndefined(obj.text.markdown);
          });

          it('should include markdown when present', function() {
            const note = new Note({
              text: {
                content: '<p>Content</p>',
                format: 2,
                markdown: 'Content'
              }
            });

            const obj = note.toObject();

            assert.equal(obj.text.markdown, 'Content');
          });
        });

        describe('Note Clone', function() {
          it('should create independent copy with new key', function() {
            const original = new Note({
              name: 'Original',
              text: { content: '<p>Original</p>' }
            });

            const clone = original.clone();

            assert.notEqual(clone.key, original.key);
            assert.equal(clone.name, 'Original');
            assert.equal(clone.text.content, '<p>Original</p>');

            // Verify independence
            clone.name = 'Clone';
            assert.equal(original.name, 'Original');
          });

          it('should reset stats on clone', function() {
            const original = new Note({
              _stats: {
                createdTime: 1000,
                modifiedTime: 2000,
                lastModifiedBy: 'other-user'
              }
            });

            const clone = original.clone();

            assert.isAbove(clone._stats.createdTime, 2000);
            assert.equal(clone._stats.lastModifiedBy, game.user.id);
          });
        });

        describe('Note JournalEntryPage Conversion', function() {
          it('should convert from JournalEntryPage', function() {
            const mockPage = {
              name: 'Test Page',
              type: 'text',
              sort: 50000,
              text: {
                content: '<p>Page content</p>',
                format: 1
              },
              uuid: 'JournalEntry.abc123.JournalEntryPage.def456',
              flags: {
                'some-module': { data: 'value' }
              }
            };

            // Mock JournalEntryPage instance check
            mockPage.constructor = { name: 'JournalEntryPage' };
            Object.setPrototypeOf(mockPage, JournalEntryPage.prototype);

            const note = Note.fromJournalEntryPage(mockPage);

            assert.equal(note.name, 'Test Page');
            assert.equal(note.sort, 50000);
            assert.equal(note.text.content, '<p>Page content</p>');
            assert.equal(note.flags[MODULE_ID].sourcePageUuid, mockPage.uuid);
            assert.equal(note.flags['some-module'].data, 'value');
          });

          it('should handle markdown pages', function() {
            const mockPage = {
              name: 'Markdown Page',
              type: 'text',
              text: {
                content: '<p>Rendered</p>',
                format: 2,
                markdown: 'Rendered'
              }
            };

            mockPage.constructor = { name: 'JournalEntryPage' };
            Object.setPrototypeOf(mockPage, JournalEntryPage.prototype);

            const note = Note.fromJournalEntryPage(mockPage);

            assert.equal(note.text.format, 2);
            assert.equal(note.text.markdown, 'Rendered');
          });

          it('should throw error for non-JournalEntryPage', function() {
            assert.throws(() => {
              Note.fromJournalEntryPage({ name: 'Not a page' });
            }, 'A valid JournalEntryPage must be provided');
          });

          it('should convert to JournalEntryPage', async function() {
            const note = new Note({
              name: 'Note to Convert',
              sort: 75000,
              text: {
                content: '<p>Note content</p>',
                format: 1
              },
              flags: {
                [MODULE_ID]: { category: 'test' },
                'custom': { data: 'preserved' }
              }
            });

            // Create mock journal
            const mockJournal = {
              createEmbeddedDocuments: async (type, data) => {
                assert.equal(type, 'JournalEntryPage');
                assert.equal(data[0].name, 'Note to Convert');
                assert.equal(data[0].type, 'text');
                assert.equal(data[0].sort, 75000);
                assert.equal(data[0].text.content, '<p>Note content</p>');
                assert.equal(data[0].flags[MODULE_ID].category, 'test');
                assert.equal(data[0].flags['custom'].data, 'preserved');

                // Return mock created page
                return [{ id: 'created-page', ...data[0] }];
              }
            };

            mockJournal.constructor = { name: 'JournalEntry' };
            Object.setPrototypeOf(mockJournal, JournalEntry.prototype);

            const page = await note.toJournalEntryPage(mockJournal);
            assert.equal(page.id, 'created-page');
          });

          it('should include markdown in conversion when present', async function() {
            const note = new Note({
              text: {
                content: '<p>Content</p>',
                format: 2,
                markdown: 'Content'
              }
            });

            const mockJournal = {
              createEmbeddedDocuments: async (type, data) => {
                assert.equal(data[0].text.markdown, 'Content');
                return [data[0]];
              }
            };

            mockJournal.constructor = { name: 'JournalEntry' };
            Object.setPrototypeOf(mockJournal, JournalEntry.prototype);

            await note.toJournalEntryPage(mockJournal);
          });

          it('should throw error if journal not provided', async function() {
            const note = new Note();

            try {
              await note.toJournalEntryPage(null);
              assert.fail('Should have thrown error');
            } catch (error) {
              assert.equal(error.message, 'A valid JournalEntry must be provided');
            }
          });
        });
      },
      { displayName: 'DND5e Sheet Notes: Note Model' }
    );
  });
}

