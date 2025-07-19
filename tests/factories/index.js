// Note a TypeScript project, these would be properly typed
// For now, using JSDoc for basic type hinting

// Utility to generate unique IDs
function generateId() {
  return `test-${Math.random().toString(36).substr(2, 9)}`;
}

// Utility to generate random integers
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class RecipeFactory {
  static create(overrides = {}) {
    const id = generateId();
    return {
      id,
      title: `Test Recipe ${randomInt(1, 1000)}`,
      cooking_instructions: 'Test cooking instructions',
      time_estimation: randomInt(15, 60),
      url: `https://example.com/recipe-${id}`,
      recipe_url_candidate_id: generateId(),
      image_url: `https://via.placeholder.com/300x200?text=Recipe+${id}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      random_order_1: randomInt(1, 1000000),
      random_order_2: randomInt(1, 1000000),
      random_order_3: randomInt(1, 1000000),
      random_order_4: randomInt(1, 1000000),
      random_order_5: randomInt(1, 1000000),
      random_order_6: randomInt(1, 1000000),
      random_order_7: randomInt(1, 1000000),
      random_order_8: randomInt(1, 1000000),
      random_order_9: randomInt(1, 1000000),
      random_order_10: randomInt(1, 1000000),
      random_order_11: randomInt(1, 1000000),
      random_order_12: randomInt(1, 1000000),
      random_order_13: randomInt(1, 1000000),
      random_order_14: randomInt(1, 1000000),
      random_order_15: randomInt(1, 1000000),
      random_order_16: randomInt(1, 1000000),
      random_order_17: randomInt(1, 1000000),
      random_order_18: randomInt(1, 1000000),
      random_order_19: randomInt(1, 1000000),
      random_order_20: randomInt(1, 1000000),
      ...overrides
    };
  }

  static createWithIngredients(ingredientCount = 3, overrides = {}) {
    const recipe = this.create(overrides);
    const ingredients = Array.from({ length: ingredientCount }, (_, index) =>
      RecipeIngredientFactory.create({
        recipe_id: recipe.id,
        ingredient_order: index + 1
      })
    );
    return { recipe, ingredients };
  }

  static createSeasonal(overrides = {}) {
    const seasonalIngredients = ['pompoen', 'spruitjes', 'witloof', 'pastinaak'];
    const ingredient = seasonalIngredients[randomInt(0, seasonalIngredients.length - 1)];
    
    return this.create({
      title: `${ingredient} Recipe`,
      ...overrides
    });
  }
}

export class ProductFactory {
  static create(overrides= {}) {
    const units = ['g', 'kg', 'ml', 'L', 'st'];
    const unit = units[randomInt(0, units.length - 1)];
    
    return {
      id: generateId(),
      name: `Test Product ${randomInt(1, 1000)}`,
      store_category_id: generateId(),
      quantity: randomInt(100, 1000),
      unit,
      normalized_price: randomInt(100, 2000) / 100, // €1.00 to €20.00
      kcal_per_100: randomInt(50, 500),
      season_start_month: null,
      season_end_month: null,
      labels: [],
      colruyt_product_url: null,
      image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unit_price: randomInt(50, 1000) / 100,
      isweightarticle: false,
      brand: null,
      walkroutesequencenumber: null,
      english_description: null,
      ...overrides
    };
  }

  static createWithUnit(unit, overrides = {}) {
    return this.create({
      unit,
      ...overrides
    });
  }
}

export class RecipeIngredientFactory {
  static create(overrides= {}) {
    const product = ProductFactory.create();
    
    return {
      id: generateId(),
      recipe_id: generateId(),
      ingredient_order: 1,
      product_id: product.id,
      quantity: randomInt(1, 500),
      unit: product.unit || 'g',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }

  static createWithProduct(product, overrides= {}) {
    return this.create({
      product_id: product.id,
      unit: product.unit || 'g',
      ...overrides
    });
  }
}

export class UserFactory {
  static create(overrides= {}) {
    return {
      id: generateId(),
      email: `test-${randomInt(1, 1000)}@example.com`,
      full_name: `Test User ${randomInt(1, 1000)}`,
      subscription_id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }
}

export class SubscriptionFactory {
  static create(overrides= {}) {
    return {
      id: generateId(),
      user_id: generateId(),
      default_servings: randomInt(2, 6),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }
}

export class WeekMenuFactory {
  static create(overrides= {}) {
    return {
      id: generateId(),
      subscription_id: generateId(),
      recipe_selections: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }
}

// Convenience function to create related data
export class TestDataFactory {
  static createUserWithSubscription() {
    const subscription = SubscriptionFactory.create();
    const user = UserFactory.create({ subscription_id: subscription.id });
    return { user, subscription };
  }

  static createRecipeWithIngredientsAndProducts(ingredientCount = 3) {
    const recipe = RecipeFactory.create();
    const products = Array.from({ length: ingredientCount }, () => ProductFactory.create());
    const ingredients = products.map((product, index) =>
      RecipeIngredientFactory.createWithProduct(product, {
        recipe_id: recipe.id,
        ingredient_order: index + 1
      })
    );

    return { recipe, ingredients, products };
  }
}