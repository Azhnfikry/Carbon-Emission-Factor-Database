import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { getEmissionFactors, getFactorById, searchFactors, filterFactors } from "./src/lib/supabase.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Carbon Emission Factor API",
      version: "1.0.0",
      description: "API for querying and calculating carbon emission factors (like Climatiq)",
      contact: {
        name: "Aethera",
        url: "https://github.com/Azhnfikry/Carbon-Emission-Factor-Database"
      }
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3000",
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API Key for authentication"
        }
      }
    }
  },
  apis: ["./server.ts"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// API Key middleware
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Allow swagger and health checks without auth
  if (req.path.includes("swagger") || req.path === "/health") {
    return next();
  }

  const apiKey = req.headers["x-api-key"];
  const validKey = process.env.API_KEY || "demo-key-123";

  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ 
      error: "Unauthorized",
      message: "Missing or invalid API key. Include 'x-api-key' header."
    });
  }

  next();
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Swagger documentation
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Apply auth middleware to /api routes
  app.use("/api", authMiddleware);

  /**
   * @swagger
   * /api/factors:
   *   get:
   *     summary: Get all emission factors
   *     description: Retrieve emission factors with optional filtering by scope and section
   *     tags:
   *       - Factors
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - name: scope
   *         in: query
   *         schema:
   *           type: string
   *         example: "Scope 1"
   *       - name: section
   *         in: query
   *         schema:
   *           type: string
   *         example: "Stationary Combustion"
   *     responses:
   *       200:
   *         description: List of emission factors
   *       401:
   *         description: Unauthorized
   */
  app.get("/api/factors", async (req, res) => {
    const { scope, section } = req.query;
    
    try {
      let filtered = await filterFactors(
        scope as string | undefined,
        section as string | undefined
      );
      
      res.json({
        success: true,
        data: filtered,
        count: filtered.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch emission factors"
      });
    }
  });

  /**
   * @swagger
   * /api/factors/{id}:
   *   get:
   *     summary: Get specific emission factor by ID
   *     tags:
   *       - Factors
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Emission factor details
   *       404:
   *         description: Factor not found
   *       401:
   *         description: Unauthorized
   */
  app.get("/api/factors/:id", async (req, res) => {
    try {
      const factor = await getFactorById(req.params.id);
      if (factor) {
        res.json({ success: true, data: factor });
      } else {
        res.status(404).json({ success: false, error: "Factor not found" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch emission factor"
      });
    }
  });

  /**
   * @swagger
   * /api/factors/search:
   *   get:
   *     summary: Search emission factors by activity type
   *     tags:
   *       - Factors
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - name: q
   *         in: query
   *         required: true
   *         schema:
   *           type: string
   *         example: "Natural Gas"
   *     responses:
   *       200:
   *         description: Search results
   *       401:
   *         description: Unauthorized
   */
  app.get("/api/factors/search", async (req, res) => {
    const query = (req.query.q as string) || "";
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: "Query parameter 'q' is required" 
      });
    }

    try {
      const results = await searchFactors(query);

      res.json({
        success: true,
        query,
        data: results,
        count: results.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to search emission factors"
      });
    }
  });

  /**
   * @swagger
   * /api/emissions/calculate:
   *   post:
   *     summary: Calculate CO2 emissions
   *     description: Calculate total emissions based on activity value and emission factor
   *     tags:
   *       - Emissions
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - activity_value
   *               - emission_factor_id
   *             properties:
   *               activity_value:
   *                 type: number
   *                 example: 100
   *               emission_factor_id:
   *                 type: string
   *                 example: "1"
   *     responses:
   *       200:
   *         description: Calculation result
   *       400:
   *         description: Invalid input
   *       404:
   *         description: Factor not found
   *       401:
   *         description: Unauthorized
   */
  app.post("/api/emissions/calculate", async (req, res) => {
    const { activity_value, emission_factor_id } = req.body;

    if (!activity_value || !emission_factor_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: activity_value, emission_factor_id"
      });
    }

    try {
      const factor = await getFactorById(emission_factor_id);
      
      if (!factor) {
        return res.status(404).json({
          success: false,
          error: "Emission factor not found"
        });
      }

      const co2e = Number(factor.co2e);
      const result = activity_value * co2e;

      res.json({
        success: true,
        data: {
          activity_value,
          activity_unit: factor.unit,
          emission_factor: {
            id: factor.id,
            type: factor.type,
            co2e: co2e,
            unit: factor.unit
          },
          result: {
            co2e_kg: result,
            co2_kg: activity_value * Number(factor.co2 || 0),
            ch4_kg: activity_value * Number(factor.ch4 || 0),
            n2o_kg: activity_value * Number(factor.no2 || 0)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to calculate emissions"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🔑 Default API Key: demo-key-123`);
    console.log(`🌍 Emission Factors: http://localhost:${PORT}/api/factors`);
  });
}

startServer();
