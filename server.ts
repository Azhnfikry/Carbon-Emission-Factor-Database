import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { emissionFactors } from "./src/data/emissionFactors.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Routes
  app.get("/api/factors", (req, res) => {
    const { scope, section } = req.query;
    
    let filtered = [...emissionFactors];
    
    if (scope) {
      filtered = filtered.filter(f => f.scope.toLowerCase() === (scope as string).toLowerCase());
    }
    
    if (section) {
      filtered = filtered.filter(f => f.section.toLowerCase().includes((section as string).toLowerCase()));
    }
    
    res.json(filtered);
  });

  // Get a specific factor by ID
  app.get("/api/factors/:id", (req, res) => {
    const factor = emissionFactors.find(f => f.id === req.params.id);
    if (factor) {
      res.json(factor);
    } else {
      res.status(404).json({ error: "Factor not found" });
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
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api/factors`);
  });
}

startServer();
