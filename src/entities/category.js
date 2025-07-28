/**
 * Category class for managing category data structure and validation
 */

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
   */
  constructor(data = {}) {
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

    this.validate();
  }

  /**
   * Update category properties
   * @param {Object} updates - Properties to update
   * @returns {Category} - Returns this for chaining
   */
  update(updates) {
    const currentData = this.toObject();
    const mergedData = foundry.utils.mergeObject(currentData, updates);

    this.name = mergedData.name;
    this.ordering = mergedData.ordering;
    this.collapsed = mergedData.collapsed;

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
