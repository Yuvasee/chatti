import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: 'ChatService',
          useValue: {
            // Mock any ChatService methods used in the controller
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return service status info', () => {
      const status = appController.getStatus();
      expect(status).toHaveProperty('service', 'chat-service');
      expect(status).toHaveProperty('status', 'online');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('timestamp');
    });
  });
});
