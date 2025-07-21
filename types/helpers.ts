import { Database } from './database';

// Extract table types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Specific table types for convenience
export type Recipe = Tables<'recipes'>;
export type RecipeIngredient = Tables<'recipe_ingredients'>;
export type Product = Tables<'products'>;
export type WeekMenu = Tables<'weekmenus'>;
export type User = Tables<'users'>;
export type Subscription = Tables<'subscriptions'>;

// Insert types for factory creation
export type RecipeInsert = InsertTables<'recipes'>;
export type RecipeIngredientInsert = InsertTables<'recipe_ingredients'>;
export type ProductInsert = InsertTables<'products'>;