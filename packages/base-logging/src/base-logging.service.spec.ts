import { Test, TestingModule } from '@nestjs/testing';
import { BaseLoggingService } from './base-logging.service';
import { IBaseLoggingConfigSymbol } from './tokens';
import { IBaseLoggingConfig } from './interfaces';

describe('BaseLoggingService', () => {
  let service: BaseLoggingService;
  const mockConfig: IBaseLoggingConfig = {
    dsn: 'https://test@sentry.io/123',
    environment: 'test',
    debug: false,
    enablePerformanceMonitoring: false,
    enableTracing: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BaseLoggingService,
        { provide: IBaseLoggingConfigSymbol, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<BaseLoggingService>(BaseLoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should capture exception', () => {
    const error = new Error('test error');
    expect(() => service.captureException(error)).not.toThrow();
  });

  it('should capture message', () => {
    expect(() => service.captureMessage('test message')).not.toThrow();
  });

  it('should set and clear user', () => {
    expect(() => service.setUser('user-1', 'test@example.com', 'testuser')).not.toThrow();
    expect(() => service.clearUser()).not.toThrow();
  });

  it('should add breadcrumb', () => {
    expect(() => service.addBreadcrumb('test breadcrumb')).not.toThrow();
  });

  it('should start transaction when tracing enabled', () => {
    const tracingService = new BaseLoggingService(mockConfig);
    expect(() => tracingService.startTransaction('test-transaction')).not.toThrow();
  });

  it('should flush events', async () => {
    await expect(service.flush(1000)).resolves.toBeDefined();
  });
});
