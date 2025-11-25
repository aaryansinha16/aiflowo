/**
 * Test script for POST /api/forms/fill endpoint
 * This tests the complete form filling flow with AI mapping
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function testFormFillAPI() {
  console.log('🧪 Testing Form Fill API with AI Mapping...\n');

  // Test data - passport application example
  const formUrl = 'https://httpbin.org/forms/post';
  const userData = {
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    size: 'Large',
    topping: 'bacon',
    comments: 'This is a test form submission using AI-powered form filling.',
  };

  console.log('📋 Form URL:', formUrl);
  console.log('📋 User Data:', JSON.stringify(userData, null, 2));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log('📤 Sending POST request to /api/forms/fill...');
    const startTime = Date.now();

    const response = await axios.post(
      `${BACKEND_URL}/api/forms/fill`,
      {
        url: formUrl,
        userData: userData,
      },
      {
        timeout: 120000, // 2 minute timeout
      }
    );

    const duration = Date.now() - startTime;

    console.log(`✅ Request completed in ${(duration / 1000).toFixed(1)}s\n`);

    if (response.data.success) {
      console.log('✨ Form Fill Successful!\n');
      console.log('📊 Summary:');
      console.log(`   - Fields Filled: ${response.data.data.fieldsFilled}`);
      console.log(`   - Fields Failed: ${response.data.data.fieldsFailed}`);
      console.log(`   - Screenshot URL: ${response.data.data.screenshot}`);
      console.log(`\n🔗 Session URL for User Review:`);
      console.log(`   ${response.data.data.sessionUrl}`);

      if (response.data.data.mappings && response.data.data.mappings.length > 0) {
        console.log(`\n📋 AI Field Mappings (${response.data.data.mappings.length} fields):`);
        response.data.data.mappings.forEach((mapping, index) => {
          console.log(`   ${index + 1}. ${mapping.selector}`);
          console.log(`      Value: "${mapping.value}"`);
          console.log(`      Confidence: ${(mapping.confidence * 100).toFixed(0)}%`);
          console.log(`      Source: ${mapping.source || 'N/A'}`);
        });
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n📖 Next Steps:');
      console.log('   1. Open the session URL in your browser');
      console.log('   2. Follow the instructions to fill the form');
      console.log('   3. Review the filled values');
      console.log('   4. Submit the form\n');
      console.log('🖼️  View Screenshot:');
      console.log(`   ${response.data.data.screenshot}\n`);
    } else {
      console.log('❌ Form Fill Failed!');
      console.log('Error:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Test Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Is the backend running?');
      console.error('Make sure to start: cd apps/backend && npm run dev');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Run the test
testFormFillAPI().catch(console.error);
