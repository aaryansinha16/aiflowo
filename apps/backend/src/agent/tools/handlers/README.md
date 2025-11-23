# Tool Handler Development Guide

## Creating New Tool Handlers

All tool handlers should extend `BaseToolHandler` and implement the `executeImpl` method.

### Best Practices

#### 1. Always Include a `message` Field

**Why?** The frontend displays this message to users. Including it makes your tool's output immediately user-friendly without frontend changes.

```typescript
protected async executeImpl(
  params: YourParams,
  context: ExecutionContext
): Promise<ToolResult> {
  // ... your tool logic ...
  
  return {
    success: true,
    data: { /* raw data for programmatic use */ },
    message: "User-friendly message here", // ✅ Always include this!
    metadata: { /* ... */ }
  };
}
```

#### 2. Structure Your Response

```typescript
{
  success: boolean;        // Required: true/false
  data: any;              // Required: raw data for other tools/systems
  message?: string;       // Recommended: user-facing display message
  summary?: string;       // Optional: brief summary (fallback if no message)
  error?: ToolError;      // Required if success = false
  metadata?: any;         // Optional: execution metadata
}
```

#### 3. Examples

**Good ✅ - Weather Tool**
```typescript
return {
  success: true,
  data: {
    temperature: 19,
    condition: "Partly Cloudy",
    humidity: 43,
    // ... raw weather data
  },
  message: "The weather in San Francisco is currently Partly Cloudy with a temperature of 19°C. Humidity is at 43%.",
  metadata: { location, units, timestamp }
};
```

**Bad ❌ - No Message**
```typescript
return {
  success: true,
  data: { temperature: 19, condition: "Partly Cloudy" },
  // ❌ No message field - frontend will show generic success
};
```

#### 4. Error Handling

Always provide helpful error messages:

```typescript
return {
  success: false,
  data: null,
  error: {
    code: 'API_ERROR',
    message: 'Failed to fetch weather data. Please try again.'
  }
};
```

### Frontend Integration

The frontend automatically displays the `message` field:

```typescript
// Frontend (automatically handled)
function formatTaskResult(task) {
  return stepResult.result?.message    // ✅ Your message!
    || stepResult.result?.summary      // Fallback
    || 'Task completed successfully';  // Last resort
}
```

### Testing Your Tool

1. Implement your tool handler with a `message` field
2. Register in `ToolsModule`
3. Add to `TOOL_REGISTRY` in `tools.types.ts`
4. Test in the chat UI - your message should display automatically!

### Migration Guide

**Old tools without `message` field:**
- Still work (shows generic success)
- Add `message` field to improve UX
- No frontend changes needed!
