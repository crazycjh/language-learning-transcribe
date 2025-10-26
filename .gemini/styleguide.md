# Code Review Guidelines

## Error Handling Rule

**All async functions must have proper try-catch error handling**

- Unhandled promise rejections can crash the application
- Catch blocks must log errors or provide user feedback
- Never leave catch blocks empty

**Bad Example**:
```typescript
async function fetchData(id: string) {
  const response = await fetch(`/api/data/${id}`);
  return await response.json();
}
```

**Good Example**:
```typescript
async function fetchData(id: string) {
  try {
    const response = await fetch(`/api/data/${id}`);
    if (!response.ok) throw new Error('Fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
```
