import { Test, TestingModule } from '@nestjs/testing';
import { SqsConsumerService } from './sqs-consumer.service';
import { AppService } from './app.service';

// Mock the AppService
jest.mock('./app.service');

describe('SqsConsumerService', () => {
  let service: SqsConsumerService;

  beforeEach(async () => {
    // Create mock SQS client
    const mockSQSClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqsConsumerService,
        AppService,
        {
          provide: 'SQS_CLIENT',
          useValue: mockSQSClient,
        },
      ],
    }).compile();

    service = module.get<SqsConsumerService>(SqsConsumerService);
  });

  describe('service instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
