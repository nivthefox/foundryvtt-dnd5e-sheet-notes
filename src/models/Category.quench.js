/**
 * Quench unit tests for Category class
 */

import { Category } from './Category.js';

export function registerCategoryTests() {
  Hooks.on('quenchReady', quench => {
    quench.registerBatch(
      'dnd5e-sheet-notes.models.category',
      context => {
        const { describe, it, assert } = context;

        describe('Category Constructor', function() {
          it('should create category with default values', function() {
            const category = new Category();

            assert.isString(category.key);
            assert.equal(category.name, 'New Category');
            assert.equal(category.ordering, 'alphabetical');
          });

          it('should create category with provided data', function() {
            const data = {
              name: 'Combat',
              ordering: 'manual'
            };

            const category = new Category(data);

            assert.equal(category.name, 'Combat');
            assert.equal(category.ordering, 'manual');
          });

          it('should preserve key when provided', function() {
            const data = {
              key: 'test-key-123',
              name: 'Test Category'
            };

            const category = new Category(data);

            assert.equal(category.key, 'test-key-123');
          });
        });

        describe('Category Update', function() {
          let category;

          this.beforeEach(function() {
            category = new Category({
              name: 'Original',
              ordering: 'alphabetical'
            });
          });

          it('should update name', function() {
            category.update({ name: 'Updated' });
            assert.equal(category.name, 'Updated');
          });


          it('should update ordering', function() {
            category.update({ ordering: 'manual' });
            assert.equal(category.ordering, 'manual');
          });

          it('should update multiple properties', function() {
            category.update({
              name: 'New Name',
              ordering: 'manual'
            });

            assert.equal(category.name, 'New Name');
            assert.equal(category.ordering, 'manual');
          });

          it('should not change key on update', function() {
            const originalKey = category.key;
            category.update({ key: 'new-key' });

            assert.equal(category.key, originalKey);
          });
        });

        describe('Category Validation', function() {
          it('should validate required fields', function() {
            assert.throws(() => {
              new Category({ key: null });
            }, 'Category key must be a non-empty string');

            assert.throws(() => {
              new Category({ name: '' });
            }, 'Category name must be a non-empty string');
          });

          it('should validate name length', function() {
            const longName = 'a'.repeat(51);

            assert.throws(() => {
              new Category({ name: longName });
            }, 'Category name must not exceed 50 characters');
          });


          it('should validate ordering values', function() {
            assert.throws(() => {
              new Category({ ordering: 'custom' });
            }, 'Ordering must be "alphabetical" or "manual"');

            assert.throws(() => {
              new Category({ ordering: null });
            }, 'Ordering must be "alphabetical" or "manual"');

            // Valid values should not throw
            assert.doesNotThrow(() => {
              new Category({ ordering: 'alphabetical' });
            });

            assert.doesNotThrow(() => {
              new Category({ ordering: 'manual' });
            });
          });
        });

        describe('Category toObject', function() {
          it('should export category data', function() {
            const category = new Category({
              name: 'Export Test',
              ordering: 'manual'
            });

            const obj = category.toObject();

            assert.isString(obj.key);
            assert.equal(obj.name, 'Export Test');
            assert.equal(obj.ordering, 'manual');
          });

          it('should not include extra properties', function() {
            const category = new Category();
            category.extraProp = 'should not be exported';

            const obj = category.toObject();

            assert.isUndefined(obj.extraProp);
            assert.hasAllKeys(obj, ['key', 'name', 'ordering']);
          });
        });

        describe('Category Clone', function() {
          it('should create independent copy with new key', function() {
            const original = new Category({
              name: 'Original',
              ordering: 'manual'
            });

            const clone = original.clone();

            assert.notEqual(clone.key, original.key);
            assert.equal(clone.name, 'Original');
            assert.equal(clone.ordering, 'manual');

            // Verify independence
            clone.name = 'Clone';
            assert.equal(original.name, 'Original');
          });
        });

        describe('Category Static Methods', function() {
          describe('nameExists', function() {
            let categories;

            this.beforeEach(function() {
              categories = [
                new Category({ key: 'cat1', name: 'Combat' }),
                new Category({ key: 'cat2', name: 'Exploration' }),
                new Category({ key: 'cat3', name: 'Roleplay' })
              ];
            });

            it('should detect existing names case-insensitively', function() {
              assert.isTrue(Category.nameExists(categories, 'Combat'));
              assert.isTrue(Category.nameExists(categories, 'COMBAT'));
              assert.isTrue(Category.nameExists(categories, 'combat'));
              assert.isTrue(Category.nameExists(categories, 'RolePlay'));
            });

            it('should return false for non-existing names', function() {
              assert.isFalse(Category.nameExists(categories, 'Social'));
              assert.isFalse(Category.nameExists(categories, 'Downtime'));
            });

            it('should exclude specified key from check', function() {
              // Should return false when checking same name with exclude key
              assert.isFalse(Category.nameExists(categories, 'Combat', 'cat1'));
              assert.isFalse(Category.nameExists(categories, 'COMBAT', 'cat1'));

              // Should still detect other categories with same name
              assert.isTrue(Category.nameExists(categories, 'Exploration', 'cat1'));
            });

            it('should handle empty categories array', function() {
              assert.isFalse(Category.nameExists([], 'Any Name'));
            });
          });
        });
      },
      { displayName: 'DND5e Sheet Notes: Category Model' }
    );
  });
}
