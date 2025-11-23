/**
 * Simplified test script for TYPE and WAIT handlers
 */
const { Queue, QueueEvents } = require('bullmq');

async function testTypeAndWait() {
  console.log('🧪 Testing TYPE and WAIT handlers (simplified)...\n');

  const queue = new Queue('browser', {
    connection: { host: 'localhost', port: 6379 },
  });

  const queueEvents = new QueueEvents('browser', {
    connection: { host: 'localhost', port: 6379 },
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
    });
    const result1 = await job1.waitUntilFinished(queueEvents, 30000);
    console.log(`   ✅ ${result1.success ? 'PASS' : 'FAIL'} - Duration: ${result1.duration}ms\n`);

    // Test 2: Wait for text
    console.log('📝 Test 2: Wait for text content');
    const job2 = await queue.add('wait-text-test', {
      type: 'wait',
      url: 'https://example.com',
      waitType: 'text',
      text: 'Example Domain',
      timeout: 10000,
    });
    const result2 = await job2.waitUntilFinished(queueEvents, 30000);
    console.log(`   ✅ ${result2.success ? 'PASS' : 'FAIL'} - Duration: ${result2.duration}ms\n`);

    // Test 3: Wait timeout
    console.log('⏱️  Test 3: Simple timeout wait (1 second)');
    const job3 = await queue.add('wait-timeout-test', {
      type: 'wait',
      url: 'https://example.com',
      waitType: 'timeout',
      timeout: 1000,
    });
    const result3 = await job3.waitUntilFinished(queueEvents, 30000);
    console.log(`   ✅ ${result3.success ? 'PASS' : 'FAIL'} - Duration: ${result3.duration}ms\n`);

    // Test 4: Type without delay
    console.log('⌨️  Test 4: Type text (fast)');
    const job4 = await queue.add('type-fast-test', {
      type: 'type',
      url: 'https://www.google.com',
      selector: 'textarea[name="q"]',
      text: 'Hello World',
      clearFirst: true,
    });
    const result4 = await job4.waitUntilFinished(queueEvents, 30000);
    console.log(`   ✅ ${result4.success ? 'PASS' : 'FAIL'} - Verified: ${result4.data?.verified} - Duration: ${result4.duration}ms\n`);

    // Test 5: Type with delay
    console.log('⌨️  Test 5: Type text (human-like with 50ms delay)');
    const job5 = await queue.add('type-delay-test', {
      type: 'type',
      url: 'https://www.google.com',
      selector: 'textarea[name="q"]',
      text: 'Playwright',
      delay: 50,
      clearFirst: true,
    });
    const result5 = await job5.waitUntilFinished(queueEvents, 30000);
    console.log(`   ✅ ${result5.success ? 'PASS' : 'FAIL'} - Verified: ${result5.data?.verified} - Duration: ${result5.duration}ms\n`);

    // Test 6: Wait for network idle
    console.log('🌐 Test 6: Wait for network idle');
    const job6 = await queue.add('wait-networkidle-test', {
      type: 'wait',
      url: 'https://example.com',
      waitType: 'networkidle',
      timeout: 15000,
    });
    const result6 = await job6.waitUntilFinished(queueEvents, 30000);
    console.log(`   ✅ ${result6.success ? 'PASS' : 'FAIL'} - Duration: ${result6.duration}ms\n`);

    // Summary
    const allPassed = [result1, result2, result3, result4, result5, result6].every(r => r.success);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(allPassed ? '🎉 All tests PASSED!' : '❌ Some tests FAILED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   Wait for selector:    ${result1.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Wait for text:        ${result2.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Wait timeout:         ${result3.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Type (fast):          ${result4.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Type (with delay):    ${result5.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Wait network idle:    ${result6.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Total duration:       ${result1.duration + result2.duration + result3.duration + result4.duration + result5.duration + result6.duration}ms`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await queueEvents.close();
    await queue.close();
    process.exit(0);
  }
}

testTypeAndWait().catch(console.error);
