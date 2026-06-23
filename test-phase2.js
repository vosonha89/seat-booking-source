const axios = require('axios');

async function testPhase2() {
  console.log('Testing Phase 2: Order → SQS → Payment Service → Mock Gateway');

  try {
    // Step 1: Check if all services are running
    console.log('\nStep 1: Checking service health...');

    // Order service
    const orderHealth = await axios.get('http://localhost:3002/');
    console.log(`✅ Order Service: ${orderHealth.status} ${orderHealth.statusText}`);

    // Payment service
    const paymentHealth = await axios.get('http://localhost:3003/');
    console.log(`✅ Payment Service: ${paymentHealth.status} ${paymentHealth.statusText}`);

    // Mock payment gateway
    const gatewayHealth = await axios.get('http://localhost:3004/');
    console.log(`✅ Mock Payment Gateway: ${gatewayHealth.status} ${gatewayHealth.statusText}`);

    // Step 2: Create a new order
    console.log('\nStep 2: Creating a new order...');

    const seatsResponse = await axios.get('http://localhost:3002/seats');
    const availableSeat = seatsResponse.data.find(seat => seat.status === 'AVAILABLE');

    if (!availableSeat) {
      throw new Error('No available seats found');
    }

    const orderData = {
      seatId: availableSeat.id,
      accountId: 'test-account',
      userId: 'test-user',
      amount: 100.00
    };

    const orderResponse = await axios.post('http://localhost:3002/orders', orderData);
    const orderId = orderResponse.data.id;

    console.log(`✅ Order created: ${orderId}`);
    console.log('Order details:', orderResponse.data);

    // Step 3: Check order status is PENDING
    console.log('\nStep 3: Checking order status...');

    const orderStatus = await axios.get(`http://localhost:3002/orders/${orderId}`);
    console.log(`✅ Order status: ${orderStatus.data.status}`);

    if (orderStatus.data.status !== 'PENDING') {
      throw new Error(`Expected PENDING status, got ${orderStatus.data.status}`);
    }

    // Step 4: Wait for payment processing
    console.log('\nStep 4: Waiting for payment processing...');

    // Wait 5 seconds for SQS message to be consumed and processed
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 5: Check if payment was processed
    console.log('\nStep 5: Checking order status after processing...');

    const finalOrderStatus = await axios.get(`http://localhost:3002/orders/${orderId}`);
    console.log(`✅ Order status: ${finalOrderStatus.data.status}`);

    if (finalOrderStatus.data.status !== 'PROCESSING' && finalOrderStatus.data.status !== 'CONFIRMED') {
      throw new Error(`Expected PROCESSING or CONFIRMED status, got ${finalOrderStatus.data.status}`);
    }

    console.log('\n✅ Phase 2 test completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPhase2();
