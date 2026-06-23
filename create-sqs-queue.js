const { SQSClient, CreateQueueCommand } = require('@aws-sdk/client-sqs');

async function createQueue() {
  const sqsClient = new SQSClient({
    endpoint: 'http://localhost:4566',
    region: 'ap-southeast-1',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    }
  });

  const command = new CreateQueueCommand({
    QueueName: 'payment-queue.fifo',
    Attributes: {
      FifoQueue: 'true',
      ContentBasedDeduplication: 'false'
    }
  });

  try {
    const response = await sqsClient.send(command);
    console.log('Queue created successfully:', response.QueueUrl);
  } catch (error) {
    console.error('Error creating queue:', error);
  }
}

createQueue();
