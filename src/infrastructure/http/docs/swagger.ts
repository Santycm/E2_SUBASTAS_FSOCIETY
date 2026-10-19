import fs from "node:fs";
import path from "node:path";
import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

const docsDirectory = path.join(__dirname);
const openApiFile = path.join(docsDirectory, "openapi.yaml");

function parseYamlFile(filePath: string) {
  try {
    return YAML.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`Error al procesar el archivo YAML: ${filePath}`);
    throw error;
  }
}

function loadOpenApiDocument() {
  const document = parseYamlFile(openApiFile);

  const pathFiles = fs
    .readdirSync(path.join(docsDirectory, "paths"))
    .filter((file) => file.endsWith(".yaml"));

  for (const file of pathFiles) {
    const content = parseYamlFile(
      path.join(docsDirectory, "paths", file),
    );

    Object.assign(document.paths, content);
  }

  const schemaFiles = fs
    .readdirSync(path.join(docsDirectory, "schemas"))
    .filter((file) => file.endsWith(".yaml"));

  document.components ??= {};
  document.components.schemas ??= {};

  for (const file of schemaFiles) {
    const content = parseYamlFile(
      path.join(docsDirectory, "schemas", file),
    );

    Object.assign(document.components.schemas, content);
  }

  return document;
}

export const swaggerDocument = loadOpenApiDocument();

export const swaggerRouter = express.Router();

swaggerRouter.get("/openapi.json", (_req, res) => {
  res.json(swaggerDocument);
});

swaggerRouter.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument),
);