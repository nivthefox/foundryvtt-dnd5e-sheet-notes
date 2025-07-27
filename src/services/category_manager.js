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
  static async createCategory(actor, categoryData = {}) {
    if (!actor) throw new Error('Actor must be provided');

    // Create category instance
    const category = new Category(categoryData);

    // Get existing categories (or initialize empty array)
    const existingCategories = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];

    // Check for duplicate name
    const existingCategoryInstances = existingCategories.map(data => new Category(data));
    if (Category.nameExists(existingCategoryInstances, category.name)) {
      throw new Error(`Category name "${category.name}" already exists`);
    }

    // Add to categories array
    existingCategories.push(category.toObject());

    // Save to actor
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

    // Convert to Category instances and sort alphabetically by name
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
  static async updateCategory(actor, categoryKey, updates) {
    if (!actor) throw new Error('Actor must be provided');
    if (!categoryKey) throw new Error('Category key must be provided');

    const categories = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];
    const categoryIndex = categories.findIndex(c => c.key === categoryKey);

    if (categoryIndex === -1) {
      throw new Error(`Category with key ${categoryKey} not found`);
    }

    // Create Category instance from existing data
    const category = new Category(categories[categoryIndex]);

    // If updating name, check for duplicates
    if (updates.name && updates.name !== category.name) {
      if (Category.nameExists(categories, updates.name, categoryKey)) {
        throw new Error(`Category name "${updates.name}" already exists`);
      }
    }

    // Apply updates
    category.update(updates);

    // Replace in array
    categories[categoryIndex] = category.toObject();

    // Save to actor
    await actor.setFlag(MODULE_ID, this.FLAG_KEY, categories);

    return category;
  }

  /**
   * Delete a category
   * @param {Actor} actor - The actor with the category
   * @param {string} categoryKey - The category key to delete
   * @returns {Promise<void>}
   */
  static async deleteCategory(actor, categoryKey) {
    if (!actor) throw new Error('Actor must be provided');
    if (!categoryKey) throw new Error('Category key must be provided');

    const categories = actor.getFlag(MODULE_ID, this.FLAG_KEY) || [];
    const filteredCategories = categories.filter(c => c.key !== categoryKey);

    if (filteredCategories.length === categories.length) {
      throw new Error(`Category with key ${categoryKey} not found`);
    }

    // Note: When we add note management later, we'll update notes with this category to have null category
    // For now, we'll just remove the category since we don't have notes yet

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

    // Verify all keys exist
    for (const key of categoryKeys) {
      if (!categoriesMap.has(key)) {
        throw new Error(`Category with key ${key} not found`);
      }
    }

    // Note: This method exists for future use but categories are always
    // displayed alphabetically regardless of sort values
    await actor.setFlag(MODULE_ID, this.FLAG_KEY, categories);
  }
}