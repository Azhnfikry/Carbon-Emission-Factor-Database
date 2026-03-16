import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not configured. API will use fallback data.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface EmissionFactor {
  id: string;
  scope: string;
  section: string;
  type: string;
  units: string;
  co2e: number;
  co2?: number;
  ch4?: number;
  no2?: number;
  unit: string;
  ref: string;
  year?: number;
  created_at?: string;
}

// Fetch all factors from Supabase
export async function getEmissionFactors() {
  try {
    const { data, error } = await supabase
      .from("emission_factors")
      .select("*");

    if (error) {
      console.error("Supabase fetch error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch from Supabase:", error);
    return [];
  }
}

// Get factor by ID
export async function getFactorById(id: string) {
  try {
    const { data, error } = await supabase
      .from("emission_factors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase fetch error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch from Supabase:", error);
    return null;
  }
}

// Search factors
export async function searchFactors(query: string) {
  try {
    const { data, error } = await supabase
      .from("emission_factors")
      .select("*")
      .or(`type.ilike.%${query}%,section.ilike.%${query}%`);

    if (error) {
      console.error("Supabase search error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Failed to search Supabase:", error);
    return [];
  }
}

// Filter by scope and section
export async function filterFactors(scope?: string, section?: string) {
  try {
    let query = supabase.from("emission_factors").select("*");

    if (scope) {
      query = query.ilike("scope", `%${scope}%`);
    }

    if (section) {
      query = query.ilike("section", `%${section}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase filter error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Failed to filter Supabase data:", error);
    return [];
  }
}
