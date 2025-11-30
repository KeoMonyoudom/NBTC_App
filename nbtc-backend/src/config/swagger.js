import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const port = process.env.PORT || 3000;
const host = process.env.HOST || "http://localhost";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NTBC API",
      version: "1.0.0",
      description: "API for managing NTBC System",
    },
    servers: [
      {
        url: `${host}:${port}`,
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ["**/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export const serveSwagger = swaggerUi.serve;
export const setupSwagger = swaggerUi.setup(swaggerSpec);
