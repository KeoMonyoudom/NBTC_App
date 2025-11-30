import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import swaggerJSDoc from "swagger-jsdoc";

const port = process.env.PORT || 3000;
const host = process.env.HOST || "http://localhost";

const __dirname = path.resolve();

// Base OpenAPI info
const baseSpec = {
  openapi: "3.0.3",
  info: {
    title: "NTBC API",
    version: "1.0.0",
    description: "API documentation for managing NTBC service",
  },
  servers: [{ url: `${host}:${port}`, description: "Local server" }],
  paths: {},
};

// Load all .yaml files from src/swagger/
const swaggerDir = path.join(__dirname, "src/swagger");
const files = fs.readdirSync(swaggerDir).filter((f) => f.endsWith(".yaml"));

files.forEach((file) => {
  const filePath = path.join(swaggerDir, file);
  const doc = yaml.load(fs.readFileSync(filePath, "utf8"));
  Object.assign(baseSpec.paths, doc.paths);
});

export const swaggerSpec = swaggerJSDoc({
  definition: baseSpec,
  apis: [], // no JS annotations, we load YAML manually
});
