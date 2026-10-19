import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Plataforma de Subastas en Línea API",
      version: "1.0.0",
      description:
        "Documentación de la API REST de la Plataforma de Subastas en Línea.",
    },
    servers: [
      {
        url: "/",
        description: "Servidor actual",
      },
    ],
    tags: [
      { name: "Health", description: "Estado de la aplicación" },
      { name: "Autenticación", description: "Registro e inicio de sesión" },
      { name: "Categorías", description: "Gestión de categorías" },
      { name: "Subastas", description: "Consulta y gestión de subastas" },
      { name: "Ofertas", description: "Ofertas realizadas en subastas" },
      { name: "Órdenes", description: "Órdenes de compra y ventas" },
      { name: "Usuarios", description: "Perfil del usuario autenticado" },
      { name: "Pagos", description: "Integración con Mercado Pago" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtenido al iniciar sesión.",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "RESOURCE_NOT_FOUND",
            },
          },
        },
        WebhookErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "INVALID_SIGNATURE",
            },
          },
        },
      },
    },
  },
  apis: [
    "./src/infrastructure/http/controllers/*.ts",
    "./src/infrastructure/http/routes/*.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
