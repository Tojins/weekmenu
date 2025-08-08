export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ingredient_product_cache: {
        Row: {
          created_at: string
          id: string
          ingredient_description: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_description: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_description?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ingredient_product_cache_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          colruyt_product_url: string | null
          created_at: string | null
          english_description: string | null
          id: string
          image_url: string | null
          isweightarticle: boolean | null
          kcal_per_100: number | null
          labels: string[] | null
          name: string | null
          normalized_price: number | null
          quantity: number | null
          season_end_month: number | null
          season_start_month: number | null
          store_category_id: string | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
          walkroutesequencenumber: number | null
        }
        Insert: {
          brand?: string | null
          colruyt_product_url?: string | null
          created_at?: string | null
          english_description?: string | null
          id?: string
          image_url?: string | null
          isweightarticle?: boolean | null
          kcal_per_100?: number | null
          labels?: string[] | null
          name?: string | null
          normalized_price?: number | null
          quantity?: number | null
          season_end_month?: number | null
          season_start_month?: number | null
          store_category_id?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          walkroutesequencenumber?: number | null
        }
        Update: {
          brand?: string | null
          colruyt_product_url?: string | null
          created_at?: string | null
          english_description?: string | null
          id?: string
          image_url?: string | null
          isweightarticle?: boolean | null
          kcal_per_100?: number | null
          labels?: string[] | null
          name?: string | null
          normalized_price?: number | null
          quantity?: number | null
          season_end_month?: number | null
          season_start_month?: number | null
          store_category_id?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          walkroutesequencenumber?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_store_category"
            columns: ["store_category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredient_overrides: {
        Row: {
          created_at: string | null
          custom_name: string | null
          id: string
          product_id: string | null
          recipe_ingredient_id: string
          subscription_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_name?: string | null
          id?: string
          product_id?: string | null
          recipe_ingredient_id: string
          subscription_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_name?: string | null
          id?: string
          product_id?: string | null
          recipe_ingredient_id?: string
          subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredient_overrides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredient_overrides_recipe_ingredient_id_fkey"
            columns: ["recipe_ingredient_id"]
            isOneToOne: false
            referencedRelation: "recipe_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredient_overrides_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string | null
          description: string | null
          dutch_description: string | null
          id: string
          ingredient_order: number | null
          product_id: string | null
          quantity: number | null
          recipe_id: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dutch_description?: string | null
          id?: string
          ingredient_order?: number | null
          product_id?: string | null
          quantity?: number | null
          recipe_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dutch_description?: string | null
          id?: string
          ingredient_order?: number | null
          product_id?: string | null
          quantity?: number | null
          recipe_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_search_history: {
        Row: {
          created_at: string | null
          id: string
          search_query: string
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          search_query: string
          started_at?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          search_query?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recipe_url_candidates: {
        Row: {
          created_at: string | null
          id: string
          recipe_search_history_id: string | null
          started_at: string | null
          status: string
          time_estimation_minutes: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_search_history_id?: string | null
          started_at?: string | null
          status: string
          time_estimation_minutes?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_search_history_id?: string | null
          started_at?: string | null
          status?: string
          time_estimation_minutes?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_url_candidates_recipe_search_history_id_fkey"
            columns: ["recipe_search_history_id"]
            isOneToOne: false
            referencedRelation: "recipe_search_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_url_candidates_recipe_search_history_id_fkey"
            columns: ["recipe_search_history_id"]
            isOneToOne: false
            referencedRelation: "stuck_search_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cooking_instructions: string
          created_at: string
          id: string
          image_url: string | null
          number_of_servings: number | null
          random_order_1: number | null
          random_order_10: number | null
          random_order_11: number | null
          random_order_12: number | null
          random_order_13: number | null
          random_order_14: number | null
          random_order_15: number | null
          random_order_16: number | null
          random_order_17: number | null
          random_order_18: number | null
          random_order_19: number | null
          random_order_2: number | null
          random_order_20: number | null
          random_order_3: number | null
          random_order_4: number | null
          random_order_5: number | null
          random_order_6: number | null
          random_order_7: number | null
          random_order_8: number | null
          random_order_9: number | null
          recipe_url_candidate_id: string | null
          time_estimation: number | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          cooking_instructions: string
          created_at?: string
          id?: string
          image_url?: string | null
          number_of_servings?: number | null
          random_order_1?: number | null
          random_order_10?: number | null
          random_order_11?: number | null
          random_order_12?: number | null
          random_order_13?: number | null
          random_order_14?: number | null
          random_order_15?: number | null
          random_order_16?: number | null
          random_order_17?: number | null
          random_order_18?: number | null
          random_order_19?: number | null
          random_order_2?: number | null
          random_order_20?: number | null
          random_order_3?: number | null
          random_order_4?: number | null
          random_order_5?: number | null
          random_order_6?: number | null
          random_order_7?: number | null
          random_order_8?: number | null
          random_order_9?: number | null
          recipe_url_candidate_id?: string | null
          time_estimation?: number | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          cooking_instructions?: string
          created_at?: string
          id?: string
          image_url?: string | null
          number_of_servings?: number | null
          random_order_1?: number | null
          random_order_10?: number | null
          random_order_11?: number | null
          random_order_12?: number | null
          random_order_13?: number | null
          random_order_14?: number | null
          random_order_15?: number | null
          random_order_16?: number | null
          random_order_17?: number | null
          random_order_18?: number | null
          random_order_19?: number | null
          random_order_2?: number | null
          random_order_20?: number | null
          random_order_3?: number | null
          random_order_4?: number | null
          random_order_5?: number | null
          random_order_6?: number | null
          random_order_7?: number | null
          random_order_8?: number | null
          random_order_9?: number | null
          recipe_url_candidate_id?: string | null
          time_estimation?: number | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_recipe_url_candidate_id_fkey"
            columns: ["recipe_url_candidate_id"]
            isOneToOne: false
            referencedRelation: "recipe_url_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_recipe_url_candidate_id_fkey"
            columns: ["recipe_url_candidate_id"]
            isOneToOne: false
            referencedRelation: "stuck_url_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          created_at: string | null
          custom_name: string | null
          display_order: number | null
          id: string
          is_checked: boolean | null
          product_id: string | null
          quantity: number
          recipe_id: string | null
          shopping_list_id: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_name?: string | null
          display_order?: number | null
          id?: string
          is_checked?: boolean | null
          product_id?: string | null
          quantity?: number
          recipe_id?: string | null
          shopping_list_id: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_name?: string | null
          display_order?: number | null
          id?: string
          is_checked?: boolean | null
          product_id?: string | null
          quantity?: number
          recipe_id?: string | null
          shopping_list_id?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          store_id: string | null
          subscription_id: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          store_id?: string | null
          subscription_id: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          store_id?: string | null
          subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      store_categories: {
        Row: {
          category_name: string
          created_at: string
          external_id: string | null
          id: string
          store_chain_id: string
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          external_id?: string | null
          id?: string
          store_chain_id: string
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          external_id?: string | null
          id?: string
          store_chain_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_categories_store_chain_id_fkey"
            columns: ["store_chain_id"]
            isOneToOne: false
            referencedRelation: "store_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      store_chains: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      store_ordering: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          store_category_id: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order: number
          id?: string
          store_category_id: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          store_category_id?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_ordering_store_category_id_fkey"
            columns: ["store_category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_ordering_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          postal_code: string | null
          store_chain_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          postal_code?: string | null
          store_chain_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          postal_code?: string | null
          store_chain_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_store_chain_id_fkey"
            columns: ["store_chain_id"]
            isOneToOne: false
            referencedRelation: "store_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          default_servings: number | null
          default_store_id: string | null
          id: string
          name: string
          plan_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_servings?: number | null
          default_store_id?: string | null
          id?: string
          name?: string
          plan_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_servings?: number | null
          default_store_id?: string | null
          id?: string
          name?: string
          plan_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_default_store_id_fkey"
            columns: ["default_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_admin: boolean
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      weekmenus: {
        Row: {
          created_at: string | null
          id: string
          recipes: Json
          seed: number
          subscription_id: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipes?: Json
          seed: number
          subscription_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          recipes?: Json
          seed?: number
          subscription_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weekmenus_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      stuck_search_queries: {
        Row: {
          created_at: string | null
          id: string | null
          search_query: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          search_query?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          search_query?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stuck_url_candidates: {
        Row: {
          created_at: string | null
          id: string | null
          recipe_search_history_id: string | null
          started_at: string | null
          status: string | null
          time_estimation_minutes: number | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          recipe_search_history_id?: string | null
          started_at?: string | null
          status?: string | null
          time_estimation_minutes?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          recipe_search_history_id?: string | null
          started_at?: string | null
          status?: string | null
          time_estimation_minutes?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_url_candidates_recipe_search_history_id_fkey"
            columns: ["recipe_search_history_id"]
            isOneToOne: false
            referencedRelation: "recipe_search_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_url_candidates_recipe_search_history_id_fkey"
            columns: ["recipe_search_history_id"]
            isOneToOne: false
            referencedRelation: "stuck_search_queries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_recipe_search_history_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          status: string
          count: number
        }[]
      }
      get_recipe_url_candidates_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          status: string
          count: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
