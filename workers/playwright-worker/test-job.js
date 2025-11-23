/**
 * Test script to send a job to the Playwright worker
 */
const { Queue, QueueEvents } = require('bullmq');

async function sendTestJob() {
  console.log('🧪 Sending test job to Playwright worker...\n');

  // Create queue connection
  const queue = new Queue('browser', {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  });

  // Create queue events listener
  const queueEvents = new QueueEvents('browser', {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  });

  try {
    // Test 1: Navigate to example.com
    console.log('📍 Test 1: Navigate to example.com');
    const job1 = await queue.add('navigate-test', {
      type: 'navigate',
      url: 'https://example.com',
      waitUntil: 'domcontentloaded',
      taskId: 'test-navigate-001',
    });
    console.log(`   ✅ Job queued: ${job1.id}\n`);

    // Wait for job to complete
    console.log('   ⏳ Waiting for job to complete...');
    const result1 = await job1.waitUntilFinished(queueEvents, 30000);
    console.log('   ✅ Job completed!');
    console.log('   📊 Result:', JSON.stringify(result1, null, 2));
    console.log('');

    // Test 2: Take a screenshot
    console.log('📸 Test 2: Take screenshot of example.com');
    const job2 = await queue.add('screenshot-test', {
      type: 'screenshot',
      url: 'https://example.com',
      fullPage: true,
      taskId: 'test-screenshot-001',
    });
    console.log(`   ✅ Job queued: ${job2.id}\n`);

    console.log('   ⏳ Waiting for job to complete...');
    const result2 = await job2.waitUntilFinished(queueEvents, 30000);
    console.log('   ✅ Job completed!');
    console.log('   📊 Screenshot captured:', result2.screenshot ? `${result2.screenshot.substring(0, 50)}... (${result2.screenshot.length} chars)` : 'N/A');
    console.log('   📊 Data:', JSON.stringify(result2.data, null, 2));
    console.log('');

    // Summary
    console.log('🎉 All tests passed!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   ✅ Navigation test: ${result1.success ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Screenshot test: ${result2.success ? 'PASS' : 'FAIL'}`);
    console.log(`   ⏱️  Total duration: ${result1.duration + result2.duration}ms`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await queueEvents.close();
    await queue.close();
    process.exit(0);
  }
}

// Run the test
sendTestJob().catch(console.error);
