// src/core/models/SystemRegistry.ts
/**
 * System Registry: Plugin Manager (Registry Pattern)
 * Loads available divination systems from the database and manages tier access.
 */

import { supabase } from '../api/supabase';

// Maps to the structure of the divination_systems table (01-DATABASE-SCHEMA.sql)
export interface SystemDefinition {
  id: string;
  system_key: string;
  system_name: Record<string, string>; // Multilingual name
  system_category: string;
  capabilities: Record<string, boolean>;
  requirements: Record<string, string>;
  availability: {
    min_tier: 'free' | 'adept' | 'apex';
    is_enabled: boolean;
  };
  cross_reference: {
    compatible_with: string[]; // List of other system_keys
  };
}

// Maps to the User's tier (unified naming)
type UserTier = 'free' | 'adept' | 'apex';

// Tier hierarchy for quick comparison (used internally)
const TIER_ORDER: Record<UserTier, number> = {
  'free': 0,
  'adept': 1,
  'apex': 2,
};

export class SystemRegistry {
  private static systems: SystemDefinition[] = [];
  private static isInitialized = false;

  /**
   * Loads all system definitions from Supabase. Must be called once at startup.
   */
  public static async initialize(): Promise<void> {
    if (SystemRegistry.isInitialized) return;

    try {
      // Fetch all system definitions, ordered by category for display
      const { data, error } = await supabase
        .from('divination_systems')
        .select('*')
        .order('system_category')
        .order('system_key');

      if (error) throw error;

      SystemRegistry.systems = data as SystemDefinition[];
      SystemRegistry.isInitialized = true;
      console.log(`✅ SystemRegistry initialized with ${data.length} systems.`);
    } catch (error) {
      console.error('Failed to initialize SystemRegistry:', error);
    }
  }

  /**
   * Checks if the user's tier meets the minimum requirement of the system.
   */
  private static canAccess(systemTier: UserTier, userTier: UserTier): boolean {
    return TIER_ORDER[userTier] >= TIER_ORDER[systemTier];
  }

  /**
   * Returns a list of systems the current user can view and access.
   */
  public static getAvailableSystems(userTier: UserTier): SystemDefinition[] {
    if (!SystemRegistry.isInitialized) {
      console.warn('SystemRegistry not initialized. Returning empty list.');
      return [];
    }

    return SystemRegistry.systems.filter(sys => 
      sys.availability.is_enabled && 
      SystemRegistry.canAccess(sys.availability.min_tier, userTier)
    );
  }

  /**
   * Looks up a system by its key.
   */
  public static getSystem(systemKey: string): SystemDefinition | undefined {
    return SystemRegistry.systems.find(sys => sys.system_key === systemKey);
  }
}

export default SystemRegistry;