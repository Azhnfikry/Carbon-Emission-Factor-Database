import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { emissionFactors } from "./src/data/emissionFactors.ts";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log("Starting database seed...");

  try {
    // Delete existing data (optional, for clean seed)
    const { error: deleteError } = await supabase
      .from("emission_factors")
      .delete()
      .neq("id", "");

    if (deleteError) {
      console.warn("Warning clearing table:", deleteError.message);
    }

    // Insert new data
    const { error, data } = await supabase
      .from("emission_factors")
      .insert(
        emissionFactors
          .filter(factor => {
            // Skip entries where co2e is not a valid number
            const co2eValue = parseFloat(factor.co2e.toString());
            return !isNaN(co2eValue) && isFinite(co2eValue);
          })
          .map((factor) => ({
            id: factor.id,
            scope: factor.scope,
            section: factor.section,
            type: factor.type,
            units: factor.units,
            co2e: parseFloat(factor.co2e.toString()),
            co2: factor.co2 ? parseFloat(factor.co2.toString()) : null,
            ch4: factor.ch4 ? parseFloat(factor.ch4.toString()) : null,
            no2: factor.no2 ? parseFloat(factor.no2.toString()) : null,
            unit: factor.unit,
            ref: factor.ref,
            year: factor.year ? parseInt(factor.year.toString()) : null,
          }))
      );

    if (error) {
      console.error("Error inserting data:", error);
      process.exit(1);
    }

    const validCount = emissionFactors.filter(factor => {
      const co2eValue = parseFloat(factor.co2e.toString());
      return !isNaN(co2eValue) && isFinite(co2eValue);
    }).length;
    const skippedCount = emissionFactors.length - validCount;

    console.log(`✅ Successfully seeded ${validCount} emission factors`);
    if (skippedCount > 0) {
      console.log(`⚠️  Skipped ${skippedCount} entries with invalid co2e values`);
    }
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seedDatabase();
