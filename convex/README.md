# Convex Backend for Element Web

This directory contains the Convex backend implementation for Element Web.

## Structure

```
convex/
├── schema.ts              # Database schema definitions
├── userPreferences.ts     # User preferences queries and mutations
├── roomMetadata.ts        # Room metadata queries and mutations
├── analytics.ts           # Analytics tracking functions
├── featureFlags.ts        # Feature flag management
├── cache.ts              # Caching layer functions
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Schema Overview

### Tables

1. **userPreferences**: User UI preferences and settings
2. **roomMetadata**: Custom room organization and metadata
3. **userSessions**: User session tracking
4. **featureFlags**: Dynamic feature management
5. **analyticsEvents**: Event tracking for analytics
6. **cachedData**: Performance caching layer

## Development

### Running Locally

```bash
# Start Convex dev server
bun run convex:dev
```

### Deploying

```bash
# Deploy to production
bun run convex:deploy
```

## Functions

### Queries (Read Operations)

- `getUserPreferences`: Fetch user preferences
- `getRoomMetadata`: Get room metadata for a user
- `getFavoriteRooms`: Get list of favorite rooms
- `isFeatureEnabled`: Check if a feature is enabled for a user
- `getCachedData`: Retrieve cached data

### Mutations (Write Operations)

- `updateUserPreferences`: Update user preferences
- `updateRoomMetadata`: Update room metadata
- `toggleFavorite`: Toggle favorite status for a room
- `trackEvent`: Track an analytics event
- `upsertSession`: Create or update user session
- `setCachedData`: Store data in cache

## Usage from Frontend

See `../CONVEX_INTEGRATION.md` for detailed usage instructions and examples.

## Best Practices

1. **Use indexes**: All queries use indexed fields for performance
2. **Validate inputs**: All mutations validate inputs with Convex validators
3. **Handle errors**: Use proper error handling in frontend
4. **Cache wisely**: Use caching for frequently accessed data
5. **Clean up**: Regularly clean expired cache entries

## Testing

Test your Convex functions:

```bash
# Add tests in convex/ directory
# Run with Convex test framework
```

## Security

- All functions validate inputs using Convex validators
- User data is scoped to userId to prevent cross-user access
- Feature flags support user targeting for gradual rollout
