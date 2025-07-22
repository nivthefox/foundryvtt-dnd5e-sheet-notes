/**
 * Category class for managing category data structure and validation
 */

export class Category {
  constructor(data = {}) {
    // Define default category structure
    const defaults = {
      key: foundry.utils.randomID(),
      name: 'New Category',
      ordering: 'alphabetical' // How notes within this category are sorted
    };

    // Merge provided data with defaults
    const categoryData = foundry.utils.mergeObject(defaults, data);

    // Assign properties
    this.key = categoryData.key;
    this.name = categoryData.name;
    this.ordering = categoryData.ordering;

    this.validate();
  }

  /**
   * Update category properties
   * @param {Object} updates - Properties to update
   * @returns {Category} - Returns this for chaining
   */
  update(updates) {
    // Merge updates into current data
    const currentData = this.toObject();
    const mergedData = foundry.utils.mergeObject(currentData, updates);

    // Update properties
    this.name = mergedData.name;
    this.ordering = mergedData.ordering;

    this.validate();
    return this;
  }

  /**
   * Export category data for storage
   * @returns {Object} - Plain object for storage
   */
  toObject() {
    return {
      key: this.key,
      name: this.name,
      ordering: this.ordering
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
    // Key validation
    if (!this.key || typeof this.key !== 'string') {
      throw new Error('Category key must be a non-empty string');
    }

    // Name validation
    if (!this.name || typeof this.name !== 'string') {
      throw new Error('Category name must be a non-empty string');
    }
    if (this.name.length > 50) {
      throw new Error('Category name must not exceed 50 characters');
    }

    // Ordering validation - controls how notes within this category are sorted
    if (this.ordering !== 'alphabetical' && this.ordering !== 'manual') {
      throw new Error('Ordering must be "alphabetical" or "manual"');
    }
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
