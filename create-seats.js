const axios = require('axios');

async function createSeats() {
  console.log('Creating seats...');

  try {
    // Check if seats already exist
    const existingSeats = await axios.get('http://localhost:3002/seats');

    if (existingSeats.data.length > 0) {
      console.log(`✅ ${existingSeats.data.length} seats already exist.`);
      console.log('Seats:', existingSeats.data);
      return existingSeats.data;
    }

    // Create 3 seats
    const seatsData = [
      { number: 'A1', row: 'A', column: 1, price: 100.00 },
      { number: 'A2', row: 'A', column: 2, price: 100.00 },
      { number: 'B1', row: 'B', column: 1, price: 80.00 }
    ];

    const createdSeats = [];

    for (const seatData of seatsData) {
      const response = await axios.post('http://localhost:3002/seats', seatData);
      createdSeats.push(response.data);
      console.log(`✅ Seat created: ${response.data.number}`);
    }

    console.log('\n✅ All seats created successfully!');
    console.log('Created seats:', createdSeats);

    return createdSeats;

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

createSeats();
