# Auto-Generated API Client

This directory contains auto-generated TypeScript types and client from the OpenAPI specification.

## 🔄 Regeneration

To regenerate the types when the backend API changes:

```bash
# Make sure backend is running on port 4000
cd apps/backend
npm run start:dev

# In another terminal, generate types
cd apps/frontend
npm run generate:api
```

## 📚 Usage

### Basic Usage

```typescript
import { apiClient } from '@/lib/api-generated';

// Type-safe API call
const { data, error } = await apiClient.GET('/api/chats');

if (error) {
  console.error('Error:', error);
} else {
  console.log('Chats:', data); // Fully typed!
}
```

### With Authentication

```typescript
import { apiClient, configureClient } from '@/lib/api-generated';

// Configure with token
const token = 'your-jwt-token';
configureClient(token);

// All requests will now include Authorization header
const { data } = await apiClient.POST('/api/chats', {
  body: {
    firstMessage: 'Hello!',
  },
});
```

### Type-Safe Requests

```typescript
// TypeScript will autocomplete paths and validate request/response types
const { data, error } = await apiClient.POST('/api/chats/{id}/tasks', {
  params: {
    path: {
      id: 'chat-123',
    },
  },
  body: {
    intent: 'Book a flight',
    priority: 'MEDIUM',
  },
});

// data is fully typed based on the OpenAPI spec
if (data) {
  console.log(data.id); // ✅ TypeScript knows this exists
  // console.log(data.invalid); // ❌ TypeScript error!
}
```

### Error Handling

```typescript
const { data, error, response } = await apiClient.GET('/api/chats/{id}', {
  params: {
    path: {
      id: chatId,
    },
  },
});

if (error) {
  switch (response.status) {
    case 404:
      console.error('Chat not found');
      break;
    case 401:
      console.error('Unauthorized');
      break;
    default:
      console.error('Error:', error);
  }
  return;
}

// Use data safely
console.log(data.title);
```

## 🎯 Benefits

- ✅ **100% Type Safe** - Autocomplete and type checking for all API calls
- ✅ **Auto-Generated** - Always in sync with backend
- ✅ **Zero Boilerplate** - No manual type definitions
- ✅ **Error Handling** - Typed errors and status codes
- ✅ **Path Validation** - TypeScript prevents invalid endpoints

## ⚠️ Important

**Do not manually edit files in this directory!**

These files are auto-generated. Any manual changes will be overwritten when you run `npm run generate:api`.

If you need to customize behavior, create wrapper functions in your application code.

## 📦 Files

- `schema.d.ts` - Auto-generated TypeScript types from OpenAPI spec
- `client.ts` - Configured API client with auth middleware
- `index.ts` - Barrel export
- `README.md` - This file

## 🔧 Configuration

The client automatically:
- Reads `NEXT_PUBLIC_API_URL` environment variable
- Adds JWT token from Zustand auth store
- Includes `Authorization: Bearer <token>` header

To customize token retrieval:

```typescript
import { setTokenGetter } from '@/lib/api-generated';

setTokenGetter(() => {
  // Your custom logic to get token
  return myAuthSystem.getToken();
});
```
