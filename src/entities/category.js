/**
 * Category class for managing category data structure and validation
 */

import { id as MODULE_ID } from '../../module.json';

const CATEGORY_ORDERING = {
  ALPHABETICAL: 0,
  MANUAL: 1
};

/**
 * Represents a note category with ordering and validation
 */
export class Category {
  /**
   * Create a new Category instance
   * @param {Object} data - Category data object
   * @param {Actor} [actor] - The actor this category belongs to
   */
  constructor(data = {}, actor = null) {
    const defaults = {
      key: foundry.utils.randomID(),
      name: 'New Category',
      ordering: CATEGORY_ORDERING.ALPHABETICAL,
      collapsed: false
    };

    const categoryData = foundry.utils.mergeObject(defaults, data);

    this.key = categoryData.key;
    this.name = categoryData.name;
    this.ordering = categoryData.ordering;
    this.collapsed = categoryData.collapsed;
    this.actor = actor;

    this.validate();
  }


  /**
   * Export category data for storage
   * @returns {Object} - Plain object for storage
   */
  toObject() {
    return {
      key: this.key,
      name: this.name,
      ordering: this.ordering,
      collapsed: this.collapsed
    };
  }

  /**
   * Create a copy of this category
   * @returns {Category} - New Category instance
   */
  clone() {
    const data = this.toObject();
    data.key = foundry.utils.randomID();
    return new Category(data);
  }

  /**
   * Validate category data
   * @throws {Error} - If validation fails
   */
  validate() {
    if (!this.key || typeof this.key !== 'string') {
      throw new Error('Category key must be a non-empty string');
    }

    if (!this.name || typeof this.name !== 'string') {
      throw new Error('Category name must be a non-empty string');
    }
    if (this.name.length > 50) {
      throw new Error('Category name must not exceed 50 characters');
    }

    if (this.ordering !== CATEGORY_ORDERING.ALPHABETICAL && this.ordering !== CATEGORY_ORDERING.MANUAL) {
      throw new Error(`Ordering must be "${CATEGORY_ORDERING.ALPHABETICAL}" or "${CATEGORY_ORDERING.MANUAL}"`);
    }
  }

  /**
   * Create a new category and persist it to the actor
   * @param {Actor} actor - The actor to add the category to
   * @param {Object} data - Category data
   * @returns {Promise<Category>} - The created category
   */
  static async create(actor, data = {}) {
    if (!actor) throw new Error('Actor must be provided');

    const category = new Category(data, actor);
    const existingCategories = actor.getFlag(MODULE_ID, 'categories') || [];

    const existingCategoryInstances = existingCategories.map(catData => new Category(catData));
    if (Category.nameExists(existingCategoryInstances, category.name)) {
      throw new Error(`Category name "${category.name}" already exists`);
    }

    existingCategories.push(category.toObject());
    await actor.setFlag(MODULE_ID, 'categories', existingCategories);

    return category;
  }

  /**
   * Retrieve a category from an actor by key
   * @param {Actor} actor - The actor to get the category from
   * @param {string} key - The category key
   * @returns {Category|null} - The category or null if not found
   */
  static fromActor(actor, key) {
    if (!actor) throw new Error('Actor must be provided');
    if (!key) throw new Error('Category key must be provided');

    const categories = actor.getFlag(MODULE_ID, 'categories') || [];
    const categoryData = categories.find(c => c.key === key);

    return categoryData ? new Category(categoryData, actor) : null;
  }

  /**
   * Update this category and persist changes to the actor
   * @param {Object} updates - Properties to update
   * @returns {Promise<Category>} - Returns this for chaining
   */
  async update(updates) {
    if (!this.actor) throw new Error('Category must be associated with an actor to update');

    const currentData = this.toObject();
    const mergedData = foundry.utils.mergeObject(currentData, updates);

    if (this.name === 'Notes' && updates.name && updates.name !== 'Notes') {
      throw new Error('Cannot rename the default Notes category');
    }

    this.name = mergedData.name;
    this.ordering = mergedData.ordering;
    this.collapsed = mergedData.collapsed;

    this.validate();

    const categories = this.actor.getFlag(MODULE_ID, 'categories') || [];
    const categoryIndex = categories.findIndex(c => c.key === this.key);

    if (categoryIndex === -1) {
      throw new Error(`Category with key "${this.key}" not found`);
    }

    categories[categoryIndex] = this.toObject();
    await this.actor.setFlag(MODULE_ID, 'categories', categories);

    return this;
  }

  /**
   * Delete this category from the actor
   * @returns {Promise<void>}
   */
  async delete() {
    if (!this.actor) throw new Error('Category must be associated with an actor to delete');

    if (this.name === 'Notes') {
      throw new Error('Cannot delete the default Notes category');
    }

    const categories = this.actor.getFlag(MODULE_ID, 'categories') || [];
    const filteredCategories = categories.filter(c => c.key !== this.key);

    const notes = this.actor.items.filter(item =>
      item.type === 'dnd5e-sheet-notes.note' && item.system.category === this.key
    );

    for (const note of notes) {
      await note.update({ 'system.category': '' });
    }

    await this.actor.setFlag(MODULE_ID, 'categories', filteredCategories);
  }

  /**
   * Toggle the collapsed state of this category
   * @returns {Promise<Category>} - Returns this for chaining
   */
  async toggleCollapsed() {
    return this.update({ collapsed: !this.collapsed });
  }

  /**
   * Ensure the default "Notes" category exists, creating it if needed
   * @param {Actor} actor - The actor to ensure has a default category
   * @returns {Promise<Category|null>} - The default category or null if not needed
   */
  static async ensureDefault(actor) {
    if (!actor) throw new Error('Actor must be provided');

    const categories = actor.getFlag(MODULE_ID, 'categories') || [];
    let defaultCategory = categories.find(c => c.name === 'Notes');

    if (!defaultCategory) {
      const uncategorizedNotes = actor.items.filter(item =>
        item.type === 'dnd5e-sheet-notes.note'
        && (!item.system.category || item.system.category === '')
      );

      if (uncategorizedNotes.length > 0) {
        defaultCategory = {
          key: foundry.utils.randomID(),
          name: 'Notes',
          ordering: 0,
          collapsed: false
        };
        categories.unshift(defaultCategory);
        await actor.setFlag(MODULE_ID, 'categories', categories);
      }
    }

    return defaultCategory ? new Category(defaultCategory, actor) : null;
  }

  /**
   * Check if category name already exists (case-insensitive)
   * @param {Array<Category>} categories - Existing categories
   * @param {string} name - Name to check
   * @param {string} excludeKey - Key to exclude from check (for updates)
   * @returns {boolean} - True if name exists
   */
  static nameExists(categories, name, excludeKey = null) {
    const lowerName = name.toLowerCase();
    return categories.some(cat =>
      cat.key !== excludeKey && cat.name.toLowerCase() === lowerName
    );
  }
}
