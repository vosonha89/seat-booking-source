import { Test, TestingModule } from '@nestjs/testing';
import { SqsProducerService } from './sqs-producer.service';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { PaymentProcessingMessage } from '@seat-booking/shared-types';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-sqs');

describe('SqsProducerService', () => {
  let service: SqsProducerService;
  let mockSqsClient: jest.Mocked<SQSClient>;
  let mockSendCommand: jest.Mock;

  beforeEach(async () => {
    // Create mock send command
    mockSendCommand = jest.fn();
    (SendMessageCommand as unknown as jest.Mock) = jest.fn(() => ({
      // Mock command properties if needed
    }));

    // Create mock SQS client
    mockSqsClient = {
      send: mockSendCommand,
    } as unknown as jest.Mocked<SQSClient>;
    (SQSClient as jest.Mock) = jest.fn(() => mockSqsClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [SqsProducerService],
    }).compile();

    service = module.get<SqsProducerService>(SqsProducerService);
  });

  describe('service instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('sendPaymentProcessingMessage', () => {
    it('should send a payment processing message to SQS', async () => {
      // Arrange
      const message: PaymentProcessingMessage = {
        orderId: 'order-123',
        seatId: 'seat-456',
        accountId: 'account-789',
        userId: 'user-012',
        amount: 100.00,
      };

      const mockResponse = {
        MessageId: 'message-abc123',
        SequenceNumber: '123456',
      };

      mockSendCommand.mockResolvedValue(mockResponse);

      // Act
      await service.sendPaymentProcessingMessage(message);

      // Assert
      expect(SQSClient).toHaveBeenCalled();
      expect(SendMessageCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          MessageBody: JSON.stringify(message),
          MessageGroupId: message.accountId,
          MessageDeduplicationId: message.orderId,
        }),
      );
      expect(mockSendCommand).toHaveBeenCalled();
    });

    it('should throw an error when SQS send fails', async () => {
      // Arrange
      const message: PaymentProcessingMessage = {
        orderId: 'order-123',
        seatId: 'seat-456',
        accountId: 'account-789',
        userId: 'user-012',
        amount: 100.00,
      };

      const error = new Error('Failed to send message');
      mockSendCommand.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.sendPaymentProcessingMessage(message),
      ).rejects.toThrow(error);
    });
  });
});
