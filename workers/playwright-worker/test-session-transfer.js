/**
 * Test script for Session Transfer feature
 * Tests the complete flow: fill form → capture session → store in Redis → generate URL
 */

const { Queue, QueueEvents } = require('bullmq');

const REDIS_CONFIG = {
  host: 'localhost',
  port: 6379,
};

const BACKEND_URL = 'http://localhost:4000';

async function testSessionTransfer() {
  const browserQueue = new Queue('browser', { connection: REDIS_CONFIG });
  const queueEvents = new QueueEvents('browser', { connection: REDIS_CONFIG });

  try {
    console.log('🧪 Testing Session Transfer Feature...\n');
    console.log('📝 Form URL: https://httpbin.org/forms/post\n');

    // Phase 1: Analyze form
    console.log('📋 Phase 1: Analyzing form...');
    const job1 = await browserQueue.add('fill_form_auto', {
      type: 'fill_form_auto',
      url: 'https://httpbin.org/forms/post',
    });
    console.log(`   ✅ Job queued: ${job1.id}`);

    const result1 = await job1.waitUntilFinished(queueEvents, 60000);
    console.log(`   ✅ Found ${result1.data.formStructure.fields.length} fields\n`);

    // Phase 2: Fill form with session capture
    console.log('📋 Phase 2: Filling form and capturing session...');
    
    const mappings = [
      { selector: 'input[name="custname"]', value: 'John Doe', fieldType: 'text' },
      { selector: 'input[name="custtel"]', value: '+1-234-567-8900', fieldType: 'tel' },
      { selector: 'input[name="custemail"]', value: 'john@example.com', fieldType: 'email' },
      { selector: 'input[name="delivery"]', value: '14:30', fieldType: 'time' },
      { selector: 'textarea[name="comments"]', value: 'Test order', fieldType: 'textarea' },
    ];

    const job2 = await browserQueue.add('fill_form_auto', {
      type: 'fill_form_auto',
      url: 'https://httpbin.org/forms/post',
      formStructure: result1.data.formStructure,
      mappings,
    });

    const result2 = await job2.waitUntilFinished(queueEvents, 60000);
    console.log(`   ✅ Form filled: ${result2.data.fieldsFilled} fields`);
    console.log(`   ✅ Session captured\n`);

    // Phase 3: Store session in Redis via backend
    console.log('📋 Phase 3: Storing session in Redis...');
    
    const sessionData = result2.data.session;
    const response = await fetch(`${BACKEND_URL}/api/forms/session/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      throw new Error(`Failed to store session: ${response.statusText}`);
    }

    const { sessionId } = await response.json();
    console.log(`   ✅ Session stored: ${sessionId}\n`);

    // Phase 4: Generate session transfer URL
    console.log('📋 Phase 4: Session Transfer URLs:\n');
    
    const sessionDataUrl = `${BACKEND_URL}/api/forms/session/${sessionId}/data`;
    const sessionLoadUrl = `${BACKEND_URL}/api/forms/session/${sessionId}/load`;

    console.log('   📊 Session Data (JSON):');
    console.log(`   ${sessionDataUrl}\n`);
    
    console.log('   🌐 Session Loader (HTML):');
    console.log(`   ${sessionLoadUrl}\n`);

    console.log('━'.repeat(70));
    console.log('✅ Session Transfer Test Complete!\n');
    console.log('📖 How to use:');
    console.log('   1. Open the Session Loader URL in your browser');
    console.log('   2. The page will restore cookies, localStorage, and sessionStorage');
    console.log('   3. You will be automatically redirected to the filled form');
    console.log('   4. Review the filled form and submit it');
    console.log('━'.repeat(70));

    console.log('\n🔗 Try it now:');
    console.log(`   open "${sessionLoadUrl}"\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await queueEvents.close();
    await browserQueue.close();
  }
}

// Run test
testSessionTransfer();
