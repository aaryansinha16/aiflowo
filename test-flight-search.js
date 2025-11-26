/**
 * Test script for flight search API
 * Usage: node test-flight-search.js <token>
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:4000';

async function testFlightSearch(token) {
  console.log('🔍 Testing Flight Search API\n');

  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/flights/search`,
      {
        from: 'BOM',
        to: 'DEL',
        date: '2025-12-15',
        passengers: 1,
        class: 'economy',
        budget: 10000,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Flight Search Successful!\n');
    console.log(`Total Results: ${response.data.totalResults}`);
    console.log(`\nFlights Found:`);
    console.log('─'.repeat(80));

    response.data.flights.forEach((flight, index) => {
      console.log(`\n${index + 1}. ${flight.airline} - ${flight.flightNumber}`);
      console.log(`   Route: ${flight.from} → ${flight.to}`);
      console.log(`   Departure: ${flight.departure}`);
      console.log(`   Arrival: ${flight.arrival}`);
      console.log(`   Duration: ${flight.duration}`);
      console.log(`   Price: ${flight.currency} ${flight.price}`);
      console.log(`   Class: ${flight.class}`);
      console.log(`   Stops: ${flight.stops}`);
      console.log(`   Available: ${flight.available ? '✓' : '✗'}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log('\n🎉 Test Passed!');
  } catch (error) {
    console.error('❌ Flight Search Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Get token from command line
const token = process.argv[2];

if (!token) {
  console.error('Usage: node test-flight-search.js <auth-token>');
  console.error('\nTo get a token:');
  console.error('1. Login to the app');
  console.error('2. Check localStorage for "aiflowo_token"');
  process.exit(1);
}

testFlightSearch(token);
