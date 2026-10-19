
import fs from "node:fs";
import path from "node:path";
import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

const docsDirectory = path.join(__dirname);
const openApiFile = path.join(docsDirectory, "openapi.yaml");

function loadOpenApiDocument() {
  const document = YAML.parse(fs.readFileSync(openApiFile, "utf8"));

  const pathFiles = fs.readdirSync(path.join(docsDirectory, "paths"))
    .filter((file) => file.endsWith(".yaml"));

  for (const file of pathFiles) {
    const content = YAML.parse(
      fs.readFileSync(path.join(docsDirectory, "paths", file), "utf8"),
    );

    Object.assign(document.paths, content);
  }

  const schemaFiles = fs.readdirSync(path.join(docsDirectory, "schemas"))
    .filter((file) => file.endsWith(".yaml"));

  document.components ??= {};
  document.components.schemas ??= {};

  for (const file of schemaFiles) {
    const content = YAML.parse(
      fs.readFileSync(path.join(docsDirectory, "schemas", file), "utf8"),
    );

    Object.assign(document.components.schemas, content);
  }

  return document;
}

export const swaggerDocument = loadOpenApiDocument();

export const swaggerRouter = express.Router();

swaggerRouter.use("/", swaggerUi.serve);
swaggerRouter.get("/", swaggerUi.setup(swaggerDocument));
swaggerRouter.get("/openapi.json", (_req, res) => {
  res.json(swaggerDocument);
});
