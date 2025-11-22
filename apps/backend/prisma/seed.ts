import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient, ToolCategory } from '@prisma/client';

// Load environment variables from root .env
config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning existing data...');
    await prisma.toolExecution.deleteMany();
    await prisma.queueJob.deleteMany();
    await prisma.taskArtifact.deleteMany();
    await prisma.taskLog.deleteMany();
    await prisma.task.deleteMany();
    await prisma.tool.deleteMany();
    await prisma.session.deleteMany();
    await prisma.magicLink.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create sample tools
  console.log('🔧 Creating tools...');
  
  const tools = [
    {
      name: 'search_google',
      displayName: 'Search Google',
      description: 'Search Google for information using keywords',
      category: ToolCategory.BROWSER,
      schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          num_results: { type: 'number', default: 10 },
        },
        required: ['query'],
      },
    },
    {
      name: 'navigate_url',
      displayName: 'Navigate to URL',
      description: 'Navigate browser to a specific URL',
      category: ToolCategory.BROWSER,
      schema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
        },
        required: ['url'],
      },
    },
    {
      name: 'take_screenshot',
      displayName: 'Take Screenshot',
      description: 'Capture a screenshot of the current page',
      category: ToolCategory.BROWSER,
      schema: {
        type: 'object',
        properties: {
          full_page: { type: 'boolean', default: false },
          selector: { type: 'string', description: 'CSS selector to screenshot' },
        },
      },
    },
    {
      name: 'fill_form',
      displayName: 'Fill Form',
      description: 'Fill out a web form with provided data',
      category: ToolCategory.BROWSER,
      schema: {
        type: 'object',
        properties: {
          fields: {
            type: 'object',
            description: 'Form fields and values',
          },
        },
        required: ['fields'],
      },
    },
    {
      name: 'send_email',
      displayName: 'Send Email',
      description: 'Send an email to specified recipients',
      category: ToolCategory.EMAIL,
      schema: {
        type: 'object',
        properties: {
          to: { type: 'array', items: { type: 'string' } },
          subject: { type: 'string' },
          body: { type: 'string' },
          html: { type: 'boolean', default: false },
        },
        required: ['to', 'subject', 'body'],
      },
    },
    {
      name: 'search_flights',
      displayName: 'Search Flights',
      description: 'Search for available flights using Amadeus API',
      category: ToolCategory.TRAVEL,
      schema: {
        type: 'object',
        properties: {
          origin: { type: 'string', description: 'Origin airport code' },
          destination: { type: 'string', description: 'Destination airport code' },
          departure_date: { type: 'string', format: 'date' },
          return_date: { type: 'string', format: 'date' },
          passengers: { type: 'number', default: 1 },
        },
        required: ['origin', 'destination', 'departure_date'],
      },
    },
    {
      name: 'book_flight',
      displayName: 'Book Flight',
      description: 'Book a selected flight',
      category: ToolCategory.TRAVEL,
      schema: {
        type: 'object',
        properties: {
          flight_offer_id: { type: 'string' },
          passenger_details: { type: 'object' },
          payment_details: { type: 'object' },
        },
        required: ['flight_offer_id', 'passenger_details'],
      },
    },
    {
      name: 'post_instagram',
      displayName: 'Post to Instagram',
      description: 'Create a post on Instagram',
      category: ToolCategory.SOCIAL,
      schema: {
        type: 'object',
        properties: {
          image_url: { type: 'string' },
          caption: { type: 'string' },
          hashtags: { type: 'array', items: { type: 'string' } },
        },
        required: ['image_url'],
      },
    },
    {
      name: 'search_jobs',
      displayName: 'Search Jobs',
      description: 'Search for job openings on various platforms',
      category: ToolCategory.JOB,
      schema: {
        type: 'object',
        properties: {
          keywords: { type: 'string' },
          location: { type: 'string' },
          job_type: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'internship'] },
          experience_level: { type: 'string', enum: ['entry', 'mid', 'senior'] },
        },
        required: ['keywords'],
      },
    },
    {
      name: 'apply_to_job',
      displayName: 'Apply to Job',
      description: 'Submit a job application',
      category: ToolCategory.JOB,
      schema: {
        type: 'object',
        properties: {
          job_id: { type: 'string' },
          resume_url: { type: 'string' },
          cover_letter: { type: 'string' },
          additional_info: { type: 'object' },
        },
        required: ['job_id', 'resume_url'],
      },
    },
    {
      name: 'read_file',
      displayName: 'Read File',
      description: 'Read contents of a file',
      category: ToolCategory.FILE,
      schema: {
        type: 'object',
        properties: {
          file_path: { type: 'string' },
        },
        required: ['file_path'],
      },
    },
    {
      name: 'write_file',
      displayName: 'Write File',
      description: 'Write content to a file',
      category: ToolCategory.FILE,
      schema: {
        type: 'object',
        properties: {
          file_path: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['file_path', 'content'],
      },
    },
  ];

  for (const tool of tools) {
    await prisma.tool.create({ data: tool });
    console.log(`  ✓ Created tool: ${tool.displayName}`);
  }

  console.log('\n✅ Database seeding completed!');
  console.log(`   - ${tools.length} tools created`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
