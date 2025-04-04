import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export interface SwaggerDocConfig {
  title: string;
  description: string;
  version: string;
  tag?: string;
  path?: string; 
}

/**
 * Set up Swagger documentation for a NestJS application
 * @param app NestJS application instance
 * @param config Swagger documentation configuration
 */
export function setupSwaggerDoc(app: INestApplication, config: SwaggerDocConfig): void {
  const options = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .setVersion(config.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  if (config.tag) {
    options.tags = [{ name: config.tag, description: `${config.tag} API endpoints` }];
  }

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(config.path || 'api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: `${config.title} API Docs`,
  });
} 