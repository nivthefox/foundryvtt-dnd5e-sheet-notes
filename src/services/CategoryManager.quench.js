/**
 * Quench unit tests for CategoryManager service
 */

import { CategoryManager } from './CategoryManager.js';
import { Category } from '../models/Category.js';
import { id as MODULE_ID } from '../../module.json';

export function registerCategoryManagerTests() {
  Hooks.on('quenchReady', quench => {
    quench.registerBatch(
      'dnd5e-sheet-notes.services.categoryManager',
      context => {
        const { describe, it, assert, beforeEach } = context;

        describe('CategoryManager', function() {
          let mockActor;

          beforeEach(function() {
            // Create mock actor with flag management
            mockActor = {
              flags: {},
              getFlag: function(module, key) {
                return this.flags[module]?.[key];
              },
              setFlag: async function(module, key, value) {
                if (!this.flags[module]) this.flags[module] = {};
                this.flags[module][key] = value;
                return Promise.resolve();
              }
            };
          });

          describe('createCategory', function() {
            it('should create first category', async function() {
              const category = await CategoryManager.createCategory(mockActor, {
                name: 'Combat'
              });

              assert.instanceOf(category, Category);
              assert.equal(category.name, 'Combat');

              const stored = mockActor.getFlag(MODULE_ID, 'categories');
              assert.isArray(stored);
              assert.equal(stored.length, 1);
              assert.equal(stored[0].name, 'Combat');
            });

            it('should create multiple categories', async function() {
              await CategoryManager.createCategory(mockActor, { name: 'Combat' });
              await CategoryManager.createCategory(mockActor, { name: 'Exploration' });
              await CategoryManager.createCategory(mockActor, { name: 'Social' });

              const stored = mockActor.getFlag(MODULE_ID, 'categories');
              assert.equal(stored.length, 3);
            });

            it('should prevent duplicate names', async function() {
              await CategoryManager.createCategory(mockActor, { name: 'Combat' });

              try {
                await CategoryManager.createCategory(mockActor, { name: 'Combat' });
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.include(error.message, 'already exists');
              }
            });

            it('should prevent duplicate names case-insensitively', async function() {
              await CategoryManager.createCategory(mockActor, { name: 'Combat' });

              try {
                await CategoryManager.createCategory(mockActor, { name: 'COMBAT' });
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.include(error.message, 'already exists');
              }
            });

            it('should use default values when not provided', async function() {
              const category = await CategoryManager.createCategory(mockActor);

              assert.equal(category.name, 'New Category');
              assert.equal(category.ordering, 'alphabetical');
            });

            it('should throw error if actor not provided', async function() {
              try {
                await CategoryManager.createCategory(null);
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.equal(error.message, 'Actor must be provided');
              }
            });
          });

          describe('getCategory', function() {
            beforeEach(async function() {
              await CategoryManager.createCategory(mockActor, { name: 'Combat' });
              await CategoryManager.createCategory(mockActor, { name: 'Exploration' });
            });

            it('should get category by key', function() {
              const categories = mockActor.getFlag(MODULE_ID, 'categories');
              const targetKey = categories[0].key;

              const category = CategoryManager.getCategory(mockActor, targetKey);

              assert.instanceOf(category, Category);
              assert.equal(category.name, 'Combat');
            });

            it('should return null for non-existent key', function() {
              const category = CategoryManager.getCategory(mockActor, 'non-existent');
              assert.isNull(category);
            });

            it('should throw error if key not provided', function() {
              assert.throws(() => {
                CategoryManager.getCategory(mockActor, null);
              }, 'Category key must be provided');
            });
          });

          describe('getAllCategories', function() {
            it('should return empty array when no categories', function() {
              const categories = CategoryManager.getAllCategories(mockActor);
              assert.isArray(categories);
              assert.equal(categories.length, 0);
            });

            it('should return all categories sorted alphabetically', async function() {
              await CategoryManager.createCategory(mockActor, { name: 'Zulu' });
              await CategoryManager.createCategory(mockActor, { name: 'Alpha' });
              await CategoryManager.createCategory(mockActor, { name: 'Mike' });

              const categories = CategoryManager.getAllCategories(mockActor);

              assert.equal(categories.length, 3);
              assert.equal(categories[0].name, 'Alpha');
              assert.equal(categories[1].name, 'Mike');
              assert.equal(categories[2].name, 'Zulu');
            });

            it('should return Category instances', async function() {
              await CategoryManager.createCategory(mockActor, { name: 'Test' });

              const categories = CategoryManager.getAllCategories(mockActor);

              assert.instanceOf(categories[0], Category);
            });
          });

          describe('getCategoryByName', function() {
            beforeEach(async function() {
              await CategoryManager.createCategory(mockActor, { name: 'Combat' });
              await CategoryManager.createCategory(mockActor, { name: 'Exploration' });
            });

            it('should find category by exact name', function() {
              const category = CategoryManager.getCategoryByName(mockActor, 'Combat');
              assert.instanceOf(category, Category);
              assert.equal(category.name, 'Combat');
            });

            it('should find category case-insensitively', function() {
              const category = CategoryManager.getCategoryByName(mockActor, 'COMBAT');
              assert.instanceOf(category, Category);
              assert.equal(category.name, 'Combat');
            });

            it('should return null for non-existent name', function() {
              const category = CategoryManager.getCategoryByName(mockActor, 'Social');
              assert.isNull(category);
            });

            it('should throw error if name not provided', function() {
              assert.throws(() => {
                CategoryManager.getCategoryByName(mockActor, '');
              }, 'Name must be provided');
            });
          });

          describe('getCategoryCount', function() {
            it('should return 0 for new actor', function() {
              assert.equal(CategoryManager.getCategoryCount(mockActor), 0);
            });

            it('should return correct count', async function() {
              await CategoryManager.createCategory(mockActor, { name: 'Cat1' });
              assert.equal(CategoryManager.getCategoryCount(mockActor), 1);

              await CategoryManager.createCategory(mockActor, { name: 'Cat2' });
              assert.equal(CategoryManager.getCategoryCount(mockActor), 2);

              await CategoryManager.createCategory(mockActor, { name: 'Cat3' });
              assert.equal(CategoryManager.getCategoryCount(mockActor), 3);
            });
          });

          describe('updateCategory', function() {
            let categoryKey;

            beforeEach(async function() {
              const category = await CategoryManager.createCategory(mockActor, {
                name: 'Original',
                ordering: 'alphabetical'
              });
              categoryKey = category.key;
            });

            it('should update category name', async function() {
              const updated = await CategoryManager.updateCategory(mockActor, categoryKey, {
                name: 'Updated'
              });

              assert.equal(updated.name, 'Updated');
            });

            it('should update multiple properties', async function() {
              const updated = await CategoryManager.updateCategory(mockActor, categoryKey, {
                name: 'New Name',
                ordering: 'manual'
              });

              assert.equal(updated.name, 'New Name');
              assert.equal(updated.ordering, 'manual');
            });

            it('should prevent duplicate names on update', async function() {
              await CategoryManager.createCategory(mockActor, { name: 'Existing' });

              try {
                await CategoryManager.updateCategory(mockActor, categoryKey, {
                  name: 'Existing'
                });
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.include(error.message, 'already exists');
              }
            });

            it('should allow updating to same name', async function() {
              const updated = await CategoryManager.updateCategory(mockActor, categoryKey, {
                name: 'Original'
              });

              assert.equal(updated.name, 'Original');
            });

            it('should throw error for non-existent category', async function() {
              try {
                await CategoryManager.updateCategory(mockActor, 'fake-key', {
                  name: 'New'
                });
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.include(error.message, 'not found');
              }
            });
          });

          describe('deleteCategory', function() {
            let cat1Key; let cat2Key;

            beforeEach(async function() {
              const cat1 = await CategoryManager.createCategory(mockActor, { name: 'Cat1' });
              const cat2 = await CategoryManager.createCategory(mockActor, { name: 'Cat2' });
              cat1Key = cat1.key;
              cat2Key = cat2.key;
            });

            it('should delete category', async function() {
              await CategoryManager.deleteCategory(mockActor, cat1Key);

              const categories = CategoryManager.getAllCategories(mockActor);
              assert.equal(categories.length, 1);
              assert.equal(categories[0].name, 'Cat2');
            });

            it('should prevent deleting last category', async function() {
              await CategoryManager.deleteCategory(mockActor, cat1Key);

              try {
                await CategoryManager.deleteCategory(mockActor, cat2Key);
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.equal(error.message, 'Cannot delete the last category');
              }
            });

            it('should update notes with deleted category', async function() {
              const mockNotes = [
                { key: 'note1', flags: { [MODULE_ID]: { category: cat1Key } } },
                { key: 'note2', flags: { [MODULE_ID]: { category: cat2Key } } },
                { key: 'note3', flags: { [MODULE_ID]: { category: cat1Key } } }
              ];

              let updatedNotes = [];

              // Override NoteManager methods temporarily
              const NoteManager = await import('./NoteManager.js').then(m => m.NoteManager);
              NoteManager.getAllNotes = () => mockNotes;
              NoteManager.updateNote = async (_actor, noteKey, updates) => {
                updatedNotes.push({ noteKey, updates });
              };

              await CategoryManager.deleteCategory(mockActor, cat1Key);

              // Verify correct notes were updated
              assert.equal(updatedNotes.length, 2);
              assert.equal(updatedNotes[0].noteKey, 'note1');
              assert.isNull(updatedNotes[0].updates.flags[MODULE_ID].category);
              assert.equal(updatedNotes[1].noteKey, 'note3');
              assert.isNull(updatedNotes[1].updates.flags[MODULE_ID].category);
            });

            it('should throw error for non-existent category', async function() {
              try {
                await CategoryManager.deleteCategory(mockActor, 'fake-key');
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.include(error.message, 'not found');
              }
            });
          });

          describe('reorderCategories', function() {
            let keys;

            beforeEach(async function() {
              const cat1 = await CategoryManager.createCategory(mockActor, { name: 'Cat1' });
              const cat2 = await CategoryManager.createCategory(mockActor, { name: 'Cat2' });
              const cat3 = await CategoryManager.createCategory(mockActor, { name: 'Cat3' });
              keys = [cat1.key, cat2.key, cat3.key];
            });

            it('should validate all keys exist', async function() {
              try {
                await CategoryManager.reorderCategories(mockActor, [keys[0], 'fake-key', keys[2]]);
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.include(error.message, 'not found');
              }
            });

            it('should accept valid reordering', async function() {
              // Should not throw
              await CategoryManager.reorderCategories(mockActor, [keys[2], keys[0], keys[1]]);

              // Categories should still be sorted alphabetically when retrieved
              const categories = CategoryManager.getAllCategories(mockActor);
              assert.equal(categories[0].name, 'Cat1');
              assert.equal(categories[1].name, 'Cat2');
              assert.equal(categories[2].name, 'Cat3');
            });

            it('should throw error if not array', async function() {
              try {
                await CategoryManager.reorderCategories(mockActor, 'not-array');
                assert.fail('Should have thrown error');
              } catch (error) {
                assert.equal(error.message, 'Category keys must be an array');
              }
            });
          });
        });
      },
      { displayName: 'DND5e Sheet Notes: CategoryManager Service' }
    );
  });
}
