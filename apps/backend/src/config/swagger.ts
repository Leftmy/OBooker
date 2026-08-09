import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OBooker API',
      version: '1.0.0',
      description: 'OBooker backend API documentation generated from the Express service.',
    },
    servers: [
      {
        url: '/',
        description: 'Local API server',
      },
    ],
    components: {
      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
        MessageResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        RoomCreateRequest: {
          type: 'object',
          required: ['name', 'capacity', 'pricePerNight'],
          properties: {
            name: { type: 'string' },
            capacity: { type: 'number' },
            pricePerNight: { type: 'number' },
            location: { type: 'string' },
          },
        },
        RoomUpdateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            capacity: { type: 'number' },
            pricePerNight: { type: 'number' },
            location: { type: 'string' },
          },
        },
        RoomResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            capacity: { type: 'number' },
            pricePerNight: { type: 'number' },
            location: { type: 'string' },
          },
        },
        BookingCreateRequest: {
          type: 'object',
          required: ['title', 'roomId', 'startTime', 'endTime'],
          properties: {
            title: { type: 'string' },
            roomId: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
          },
        },
        BookingResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            userId: { type: 'string' },
            roomId: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        BookingsListResponse: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/BookingResponse',
              },
            },
            nextCursor: {
              type: 'string',
              nullable: true,
            },
            hasMore: {
              type: 'boolean',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/**/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
