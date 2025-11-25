/**
 * Manual Test Script for Form Filler (Issue #17)
 * 
 * This script tests the automatic form filling feature by:
 * 1. Analyzing a contact form's DOM structure
 * 2. Using AI to map user data to form fields
 * 3. Filling the form automatically
 */

const { Queue, QueueEvents } = require('bullmq');
const Redis = require('ioredis');

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

// Create queue and queue events
const queue = new Queue('browser', { connection });
const queueEvents = new QueueEvents('browser', { connection });

// Sample user data
const sampleUserData = {
  personal: {
    full_name: 'Aaryan Sinha',
    first_name: 'Aaryan',
    last_name: 'Sinha',
    email: 'aaryan.sinha@example.com',
    phone: '+91 98765 43210',
    date_of_birth: '1995-08-15',
  },
  address: {
    street: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postal_code: '400001',
    zip: '400001',
  },
  professional: {
    company: 'Tech Corp',
    job_title: 'Software Engineer',
    website: 'https://example.com',
  },
  other: {
    message: 'This is a test message from the automated form filler!',
    comments: 'Testing the form filling feature.',
    subject: 'Test Contact Form Submission',
  },
};

/**
 * Test contact form URLs you can use:
 * 
 * 1. https://www.w3schools.com/html/tryit.asp?filename=tryhtml_form_submit
 * 2. https://httpbin.org/forms/post (simple form)
 * 3. https://jsfiddle.net/ (create your own)
 * 4. Any website with a contact form
 */

async function testFormFiller() {
  console.log('🧪 Testing Form Filler (Issue #17)...\n');

  try {
    // Step 1: Choose a form URL
    const formUrl = process.argv[2] || 'https://httpbin.org/forms/post';
    console.log(`📝 Form URL: ${formUrl}\n`);

    // Step 2: Phase 1 - Analyze DOM and get form structure
    console.log('📋 Phase 1: Analyzing form structure...');
    const job1 = await queue.add('analyze-form', {
      type: 'fill_form_auto',
      url: formUrl,
      // No mappings - this will trigger DOM analysis
    });
    console.log(`   ✅ Job queued: ${job1.id}`);
    console.log('   ⏳ Waiting for analysis to complete...\n');

    // Wait for job to complete (60s timeout for slow forms)
    const result1 = await job1.waitUntilFinished(queueEvents, 60000);
    
    if (!result1.success) {
      console.error('   ❌ Analysis FAILED:', result1.error);
      return;
    }

    console.log('   ✅ Analysis complete!\n');
    console.log('📊 Form Structure:');
    console.log('   URL:', result1.data.formStructure.url);
    console.log('   Title:', result1.data.formStructure.title);
    console.log('   Fields found:', result1.data.formStructure.fields.length);
    console.log('\n📝 Fields:');
    
    result1.data.formStructure.fields.forEach((field, index) => {
      console.log(`   ${index + 1}. [${field.type}] ${field.label || field.name || field.selector}`);
      if (field.required) console.log(`      Required: ✓`);
      if (field.options) console.log(`      Options: ${field.options.slice(0, 3).join(', ')}${field.options.length > 3 ? '...' : ''}`);
    });

    console.log('\n' + '━'.repeat(60));
    console.log('🤖 Now you need to map the fields using AI...');
    console.log('━'.repeat(60) + '\n');

    // In a real scenario, you would:
    // 1. Send the form structure to the backend
    // 2. Backend calls FieldMapperService with user data
    // 3. AI returns mappings
    // 4. Backend enqueues Phase 2 job with mappings

    // For manual testing, let's simulate simple mappings
    console.log('📋 Phase 2: Creating manual mappings for demo...\n');
    
    const mappings = createSimpleMappings(result1.data.formStructure.fields, sampleUserData);
    
    console.log(`   Created ${mappings.length} mappings:`);
    mappings.forEach((mapping, index) => {
      console.log(`   ${index + 1}. ${mapping.selector} → "${mapping.value}"`);
    });

    console.log('\n📋 Phase 2: Filling form with mappings...');
    const job2 = await queue.add('fill-form', {
      type: 'fill_form_auto',
      url: formUrl,
      formStructure: result1.data.formStructure,
      mappings: mappings,
    });
    console.log(`   ✅ Job queued: ${job2.id}`);
    console.log('   ⏳ Waiting for form to be filled...\n');

    // Wait for job to complete (60s timeout for slow forms)
    const result2 = await job2.waitUntilFinished(queueEvents, 60000);
    
    if (!result2.success) {
      console.error('   ❌ Form filling FAILED:', result2.error);
      if (result2.data?.screenshot) {
        console.log('   📸 Error screenshot available');
      }
      return;
    }

    console.log('   ✅ Form filled successfully!\n');
    console.log('📊 Results:');
    console.log(`   Fields filled: ${result2.data.fieldsFilled}`);
    console.log(`   Fields failed: ${result2.data.fieldsFailed}`);
    
    if (result2.data.failedFields && result2.data.failedFields.length > 0) {
      console.log('\n   ⚠️  Failed fields:');
      result2.data.failedFields.forEach((field) => {
        console.log(`      - ${field.selector}: ${field.error}`);
      });
    }

    console.log(`\n   Verification: ${result2.data.verification.allFilled ? '✅ All filled' : '⚠️  Some empty'}`);
    console.log(`   Filled: ${result2.data.verification.filledCount}/${result2.data.verification.totalCount}`);
    
    if (result2.data.verification.emptyFields.length > 0) {
      console.log(`   Empty fields: ${result2.data.verification.emptyFields.join(', ')}`);
    }

    if (result2.data.screenshot) {
      console.log('\n   📸 Screenshot captured (base64)');
      console.log(`   Screenshot size: ${(result2.data.screenshot.length / 1024).toFixed(2)} KB`);
      
      // Optionally save screenshot
      const fs = require('fs');
      const screenshotPath = './form-filled-screenshot.png';
      fs.writeFileSync(screenshotPath, Buffer.from(result2.data.screenshot, 'base64'));
      console.log(`   💾 Screenshot saved to: ${screenshotPath}`);
    }

    if (result2.data.session) {
      console.log('\n   🍪 Session captured for transfer:');
      console.log(`   Cookies: ${result2.data.session.cookies.length}`);
      console.log(`   LocalStorage keys: ${Object.keys(result2.data.session.localStorage).length}`);
      console.log(`   SessionStorage keys: ${Object.keys(result2.data.session.sessionStorage).length}`);
      console.log(`   URL: ${result2.data.session.url}`);
      console.log(`   Expires: ${new Date(result2.data.session.expiresAt).toLocaleString()}`);
    }

    console.log('\n' + '━'.repeat(60));
    console.log('✅ Form Filler Test Complete!');
    console.log('━'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    // Cleanup
    await queueEvents.close();
    await queue.close();
    await connection.quit();
  }
}

/**
 * Create simple field mappings (without AI for manual testing)
 * In production, this would be done by the FieldMapperService using LLM
 */
function createSimpleMappings(fields, userData) {
  const mappings = [];
  
  // Flatten user data
  const flatData = flattenObject(userData);
  
  for (const field of fields) {
    const searchKey = (field.label || field.name || '').toLowerCase();
    let value = null;
    let matchedKey = null;
    
    // Handle different field types
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        // Try to find matching data
        for (const [key, val] of Object.entries(flatData)) {
          const normalizedKey = key.toLowerCase().replace(/[_\.]/g, '');
          const normalizedSearch = searchKey.replace(/[^a-z0-9]/g, '');
          
          if (normalizedSearch.includes(normalizedKey) || normalizedKey.includes(normalizedSearch)) {
            value = val;
            matchedKey = key;
            break;
          }
        }
        
        // Special case mappings for text fields
        if (!value) {
          if (searchKey.includes('name') && !searchKey.includes('user') && !searchKey.includes('company')) {
            value = flatData['personal.full_name'] || flatData['personal.first_name'];
            matchedKey = 'personal.full_name';
          } else if (searchKey.includes('email') || searchKey.includes('e-mail')) {
            value = flatData['personal.email'];
            matchedKey = 'personal.email';
          } else if (searchKey.includes('phone') || searchKey.includes('tel') || searchKey.includes('mobile')) {
            value = flatData['personal.phone'];
            matchedKey = 'personal.phone';
          } else if (searchKey.includes('subject')) {
            value = flatData['other.subject'];
            matchedKey = 'other.subject';
          }
        }
        break;
      
      case 'textarea':
        // Map to message or comments
        if (searchKey.includes('message') || searchKey.includes('comment') || searchKey.includes('instruction') || searchKey.includes('note')) {
          value = flatData['other.message'] || flatData['other.comments'];
          matchedKey = 'other.message';
        }
        break;
      
      case 'checkbox':
        // Check some checkboxes based on label
        // For demo: check first 2 checkboxes
        const checkboxIndex = fields.filter(f => f.type === 'checkbox').indexOf(field);
        if (checkboxIndex < 2) {
          value = true;
          matchedKey = 'demo_checkbox';
        }
        break;
      
      case 'radio':
        // Select first option for radio groups
        if (field.options && field.options.length > 0) {
          value = field.options[0]; // Select first option
          matchedKey = 'demo_radio';
        }
        break;
      
      case 'select':
        // Select first non-empty option
        if (field.options && field.options.length > 0) {
          // Skip empty options
          const nonEmptyOptions = field.options.filter(opt => opt && opt.trim());
          if (nonEmptyOptions.length > 0) {
            value = nonEmptyOptions[0];
            matchedKey = 'demo_select';
          }
        }
        break;
      
      case 'date':
        // Use date of birth if available
        if (searchKey.includes('birth') || searchKey.includes('dob')) {
          value = flatData['personal.date_of_birth'];
          matchedKey = 'personal.date_of_birth';
        } else if (searchKey.includes('delivery') || searchKey.includes('order') || searchKey.includes('ship')) {
          // Future date for delivery
          value = '2024-12-31';
          matchedKey = 'demo_delivery_date';
        } else {
          // Default to a date
          value = '2024-12-25';
          matchedKey = 'demo_date';
        }
        break;
      
      case 'datetime-local':
        // Date and time
        value = '2024-12-25T14:30';
        matchedKey = 'demo_datetime';
        break;
      
      case 'time':
        // Time only
        value = '14:30';
        matchedKey = 'demo_time';
        break;
      
      case 'week':
        // Week number
        value = '2024-W52';
        matchedKey = 'demo_week';
        break;
      
      case 'month':
        // Month and year
        value = '2024-12';
        matchedKey = 'demo_month';
        break;
    }
    
    if (value !== null && value !== undefined) {
      mappings.push({
        selector: field.selector,
        value: value,
        confidence: 0.8,
        fieldType: field.type,
        source: matchedKey,
      });
    }
  }
  
  return mappings;
}

/**
 * Flatten nested object
 */
function flattenObject(obj, prefix = '') {
  const flat = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flat, flattenObject(value, fullKey));
    } else {
      flat[fullKey] = value;
    }
  }
  
  return flat;
}

// Run the test
testFormFiller();
