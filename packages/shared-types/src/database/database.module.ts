import { Module, DynamicModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        ConfigModule,
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => {
            const host = configService.get<string>('MONGO_HOST') || 'localhost';
            const port = configService.get<string>('MONGO_PORT') || '27017';
            const dbName = configService.get<string>('MONGO_DB_NAME') || 'chatti';
            
            // For development, don't use authentication
            const uri = `mongodb://${host}:${port}/${dbName}`;
              
            return { uri };
          },
          inject: [ConfigService],
        }),
      ],
      exports: [MongooseModule],
    };
  }
} 