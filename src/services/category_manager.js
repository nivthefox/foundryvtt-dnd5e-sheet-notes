/**
 * CategoryManager - Service for managing category CRUD operations on actors
 */

import { id as MODULE_ID } from '../../module.json';
import { Category } from '../entities/category';

export class CategoryManager {
  static FLAG_KEY = 'categories';

  /**
   * Create a new category on the actor
   * @param {Actor} actor - The actor to add the category to
   * @param {Object} categoryData - Category data
   * @returns {Promise<Category>} - The created category
   */
  static async create(actor, categoryData = {}) {
    if (!actor) throw new Error('Actor must be provided');

    const category = new Category(categoryData);

    const existingCategories = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];

    const existingCategoryInstances = existingCategories.map(data => new Category(data));
    if (Category.nameExists(existingCategoryInstances, category.name)) {
      throw new Error(`Category name "${category.name}" already exists`);
    }

    existingCategories.push(category.toObject());

    await actor.setFlag(MODULE_ID, this.FLAG_KEY, existingCategories);

    return category;
  }

  /**
   * Get a specific category by key
   * @param {Actor} actor - The actor to get the category from
   * @param {string} categoryKey - The category key
   * @returns {Category|null} - The category or null if not found
   */
  static getCategory(actor, categoryKey) {
    if (!actor) throw new Error('Actor must be provided');
    if (!categoryKey) throw new Error('Category key must be provided');

    const categories = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];
    const categoryData = categories.find(c => c.key === categoryKey);

    return categoryData ? new Category(categoryData) : null;
  }

  /**
   * Get all categories for an actor
   * @param {Actor} actor - The actor to get categories from
   * @returns {Array<Category>} - Array of Category instances sorted alphabetically
   */
  static getAllCategories(actor) {
    if (!actor) throw new Error('Actor must be provided');

    const categoriesData = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];

    return categoriesData
      .map(data => new Category(data))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get a category by name (case-insensitive)
   * @param {Actor} actor - The actor to search in
   * @param {string} name - The category name to find
   * @returns {Category|null} - The category or null if not found
   */
  static getCategoryByName(actor, name) {
    if (!actor) throw new Error('Actor must be provided');
    if (!name) throw new Error('Name must be provided');

    const lowerName = name.toLowerCase();
    const categories = this.getAllCategories(actor);

    return categories.find(cat => cat.name.toLowerCase() === lowerName) || null;
  }

  /**
   * Get count of categories for an actor
   * @param {Actor} actor - The actor to count categories for
   * @returns {number} - Number of categories
   */
  static getCategoryCount(actor) {
    if (!actor) throw new Error('Actor must be provided');

    const categories = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];
    return categories.length;
  }

  /**
   * Update an existing category
   * @param {Actor} actor - The actor with the category
   * @param {string} categoryKey - The category key
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Category>} - The updated category
   */
  static async update(actor, categoryKey, updates) {
    if (!actor) throw new Error('Actor must be provided');
    if (!categoryKey) throw new Error('Category key must be provided');

    const categories = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];
    const categoryIndex = categories.findIndex(c => c.key === categoryKey);

    if (categoryIndex === -1) {
      throw new Error(`Category with key ${categoryKey} not found`);
    }

    const category = new Category(categories[categoryIndex]);

    if (updates.name && updates.name !== category.name) {
      if (Category.nameExists(categories, updates.name, categoryKey)) {
        throw new Error(`Category name "${updates.name}" already exists`);
      }
    }

    category.update(updates);

    categories[categoryIndex] = category.toObject();

    await actor.setFlag(MODULE_ID, this.FLAG_KEY, categories);

    return category;
  }

  /**
   * Delete a category
   * @param {Actor} actor - The actor with the category
   * @param {string} categoryKey - The category key to delete
   * @returns {Promise<void>}
   */
  static async delete(actor, categoryKey) {
    if (!actor) throw new Error('Actor must be provided');
    if (!categoryKey) throw new Error('Category key must be provided');

    const categories = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];
    const filteredCategories = categories.filter(c => c.key !== categoryKey);

    if (filteredCategories.length === categories.length) {
      throw new Error(`Category with key ${categoryKey} not found`);
    }

    const notesInCategory = actor.items.filter(item =>
      item.type === 'dnd5e-sheet-notes.note' && item.system.category === categoryKey
    );

    const updates = notesInCategory.map(note => ({
      _id: note.id,
      'system.category': ''
    }));

    if (updates.length > 0) {
      await actor.updateEmbeddedDocuments('Item', updates);
    }

    await actor.setFlag(MODULE_ID, this.FLAG_KEY, filteredCategories);
  }

  /**
   * Reorder categories (updates sort values for manual ordering)
   * Note: This is only used when categories are displayed with manual ordering,
   * but categories themselves are always sorted alphabetically
   * @param {Actor} actor - The actor with the categories
   * @param {Array<string>} categoryKeys - Array of category keys in desired order
   * @returns {Promise<void>}
   */
  static async reorderCategories(actor, categoryKeys) {
    if (!actor) throw new Error('Actor must be provided');
    if (!Array.isArray(categoryKeys)) throw new Error('Category keys must be an array');

    const categories = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];
    const categoriesMap = new Map(categories.map(c => [c.key, c]));

    for (const key of categoryKeys) {
      if (!categoriesMap.has(key)) {
        throw new Error(`Category with key ${key} not found`);
      }
    }

    await actor.setFlag(MODULE_ID, this.FLAG_KEY, categories);
  }
}
