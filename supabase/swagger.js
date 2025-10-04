import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';

const serverUrl = isProd
  ? process.env.PROD_URL
  : `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API Docs',
      version: '1.0.0',
      description: 'Auto-generated API documentation with Swagger',
    },
    servers: [
      {
        url: serverUrl,
        description: isProd ? 'Production server' : 'Local development server',
      },
    ],
  },
  apis: [join(__dirname, 'functions/**/*.js')],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}