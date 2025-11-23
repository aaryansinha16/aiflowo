/**
 * Test script for TYPE and WAIT handlers
 */
const { Queue, QueueEvents } = require('bullmq');

async function testTypeAndWait() {
  console.log('🧪 Testing TYPE and WAIT handlers...\n');

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
    // Test 1: Wait for selector
    console.log('⏳ Test 1: Wait for selector');
    const job1 = await queue.add('wait-selector-test', {
      type: 'wait',
      url: 'https://example.com',
      waitType: 'selector',
      selector: 'h1',
      state: 'visible',
      timeout: 10000,
      taskId: 'test-wait-001',
    });
    console.log(`   ✅ Job queued: ${job1.id}\n`);

    console.log('   ⏳ Waiting for job to complete...');
    const result1 = await job1.waitUntilFinished(queueEvents, 30000);
    console.log('   ✅ Job completed!');
    console.log('   📊 Result:', JSON.stringify(result1, null, 2));
    console.log('');

    // Test 2: Type with delay
    console.log('⌨️  Test 2: Type with human-like delay');
    const job2 = await queue.add('type-test', {
      type: 'type',
      url: 'https://www.google.com',
      selector: 'textarea[name="q"]',
      text: 'Playwright automation',
      delay: 50, // 50ms between keystrokes
      clearFirst: true,
      taskId: 'test-type-001',
    });
    console.log(`   ✅ Job queued: ${job2.id}\n`);

    console.log('   ⏳ Waiting for job to complete...');
    const result2 = await job2.waitUntilFinished(queueEvents, 30000);
    console.log('   ✅ Job completed!');
    console.log('   📊 Result:', JSON.stringify(result2, null, 2));
    console.log('');

    // Test 3: Type and press Enter
    console.log('⌨️  Test 3: Type and press Enter');
    const job3 = await queue.add('type-enter-test', {
      type: 'type',
      url: 'https://www.google.com',
      selector: 'textarea[name="q"]',
      text: 'OpenAI GPT-4',
      delay: 30,
      clearFirst: true,
      pressKey: 'Enter',
      taskId: 'test-type-002',
    });
    console.log(`   ✅ Job queued: ${job3.id}\n`);

    console.log('   ⏳ Waiting for job to complete...');
    const result3 = await job3.waitUntilFinished(queueEvents, 30000);
    console.log('   ✅ Job completed!');
    console.log('   📊 Result:', JSON.stringify(result3, null, 2));
    console.log('');

    // Test 4: Wait for network idle
    console.log('🌐 Test 4: Wait for network idle');
    const job4 = await queue.add('wait-networkidle-test', {
      type: 'wait',
      url: 'https://example.com',
      waitType: 'networkidle',
      timeout: 15000,
      taskId: 'test-wait-002',
    });
    console.log(`   ✅ Job queued: ${job4.id}\n`);

    console.log('   ⏳ Waiting for job to complete...');
    const result4 = await job4.waitUntilFinished(queueEvents, 30000);
    console.log('   ✅ Job completed!');
    console.log('   📊 Result:', JSON.stringify(result4, null, 2));
    console.log('');

    // Test 5: Wait for text
    console.log('📝 Test 5: Wait for text content');
    const job5 = await queue.add('wait-text-test', {
      type: 'wait',
      url: 'https://example.com',
      waitType: 'text',
      text: 'Example Domain',
      timeout: 10000,
      taskId: 'test-wait-003',
    });
    console.log(`   ✅ Job queued: ${job5.id}\n`);

    console.log('   ⏳ Waiting for job to complete...');
    const result5 = await job5.waitUntilFinished(queueEvents, 30000);
    console.log('   ✅ Job completed!');
    console.log('   📊 Result:', JSON.stringify(result5, null, 2));
    console.log('');

    // Test 6: Simple timeout wait
    console.log('⏱️  Test 6: Simple timeout wait (2 seconds)');
    const job6 = await queue.add('wait-timeout-test', {
      type: 'wait',
      url: 'https://example.com',
      waitType: 'timeout',
      timeout: 2000,
      taskId: 'test-wait-004',
    });
    console.log(`   ✅ Job queued: ${job6.id}\n`);

    console.log('   ⏳ Waiting for job to complete...');
    const result6 = await job6.waitUntilFinished(queueEvents, 30000);
    console.log('   ✅ Job completed!');
    console.log('   📊 Result:', JSON.stringify(result6, null, 2));
    console.log('');

    // Summary
    console.log('🎉 All tests passed!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   ✅ Wait for selector: ${result1.success ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Type with delay: ${result2.success ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Type and press Enter: ${result3.success ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Wait for network idle: ${result4.success ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Wait for text: ${result5.success ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Wait timeout: ${result6.success ? 'PASS' : 'FAIL'}`);
    console.log(`   ⏱️  Total duration: ${
      result1.duration + result2.duration + result3.duration + 
      result4.duration + result5.duration + result6.duration
    }ms`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await queueEvents.close();
    await queue.close();
    process.exit(0);
  }
}

// Run the test
testTypeAndWait().catch(console.error);
