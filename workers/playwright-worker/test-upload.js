/**
 * Test script for UPLOAD handler
 * 
 * Prerequisites:
 * 1. MinIO running on localhost:9000
 * 2. Bucket 'aiflowo-uploads' created
 * 3. Test file uploaded to S3
 */
const { Queue, QueueEvents } = require('bullmq');
const { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// S3 Client setup
const s3Client = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
  forcePathStyle: true,
});

const BUCKET_NAME = 'aiflowo-uploads';

/**
 * Ensure bucket exists
 */
async function ensureBucket() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`✅ Bucket '${BUCKET_NAME}' exists`);
  } catch (error) {
    if (error.name === 'NotFound') {
      console.log(`📦 Creating bucket '${BUCKET_NAME}'...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`✅ Bucket created`);
    } else {
      throw error;
    }
  }
}

/**
 * Upload a test file to S3
 */
async function uploadTestFile() {
  const testContent = `
# Test Resume

## John Doe
Email: john@example.com
Phone: (555) 123-4567

## Experience
- Software Engineer at Tech Corp (2020-Present)
- Junior Developer at StartupCo (2018-2020)

## Skills
- JavaScript, TypeScript, Node.js
- React, Next.js
- Playwright, Testing

## Education
- BS Computer Science, University of Technology (2018)
`;

  const key = 'test-files/resume.txt';
  
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: testContent,
      ContentType: 'text/plain',
    }));
    
    console.log(`✅ Test file uploaded to S3: ${key}`);
    return key;
  } catch (error) {
    console.error('❌ Failed to upload test file:', error.message);
    throw error;
  }
}

/**
 * Test file upload functionality
 */
async function testFileUpload() {
  console.log('🧪 Testing UPLOAD handler...\n');

  const queue = new Queue('browser', {
    connection: { host: 'localhost', port: 6379 },
  });

  const queueEvents = new QueueEvents('browser', {
    connection: { host: 'localhost', port: 6379 },
  });

  try {
    // Setup: Ensure bucket and test file exist
    console.log('📋 Setup: Preparing S3 bucket and test file...');
    await ensureBucket();
    const testFileKey = await uploadTestFile();
    console.log('');

    // Test 1: Upload file from S3
    console.log('📤 Test 1: Upload file from S3 to form');
    const job1 = await queue.add('upload-s3-test', {
      type: 'upload',
      url: 'https://the-internet.herokuapp.com/upload',
      selector: '#file-upload',
      fileSource: 's3',
      s3Key: testFileKey,
      s3Bucket: BUCKET_NAME,
      taskId: 'test-upload-001',
    });
    console.log(`   ✅ Job queued: ${job1.id}\n`);

    console.log('   ⏳ Waiting for job to complete...');
    const result1 = await job1.waitUntilFinished(queueEvents, 60000);
    console.log(`   ${result1.success ? '✅ PASS' : '❌ FAIL'} - Duration: ${result1.duration}ms`);
    if (result1.success) {
      console.log(`   📊 Files uploaded: ${result1.data?.filesUploaded?.join(', ')}`);
      console.log(`   ✓ Verified: ${result1.data?.verified}`);
    } else {
      console.log(`   ❌ Error: ${result1.error}`);
    }
    console.log('');

    // Test 2: Upload file from URL
    console.log('📤 Test 2: Upload file from URL');
    const job2 = await queue.add('upload-url-test', {
      type: 'upload',
      url: 'https://the-internet.herokuapp.com/upload',
      selector: '#file-upload',
      fileSource: 'url',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      taskId: 'test-upload-002',
    });
    console.log(`   ✅ Job queued: ${job2.id}\n`);

    console.log('   ⏳ Waiting for job to complete...');
    const result2 = await job2.waitUntilFinished(queueEvents, 60000);
    console.log(`   ${result2.success ? '✅ PASS' : '❌ FAIL'} - Duration: ${result2.duration}ms`);
    if (result2.success) {
      console.log(`   📊 Files uploaded: ${result2.data?.filesUploaded?.join(', ')}`);
      console.log(`   ✓ Verified: ${result2.data?.verified}`);
    } else {
      console.log(`   ❌ Error: ${result2.error}`);
    }
    console.log('');

    // Summary
    const allPassed = result1.success && result2.success;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(allPassed ? '🎉 All tests PASSED!' : '❌ Some tests FAILED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   Upload from S3:    ${result1.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Upload from URL:   ${result2.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Total duration:    ${result1.duration + result2.duration}ms`);

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
testFileUpload().catch(console.error);
