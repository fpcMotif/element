# Convex Backend Integration with Effect-TS

This document describes the Convex backend integration and Effect-TS refactoring for Element Web.

## Overview

Element Web now includes a Convex backend for storing auxiliary data that doesn't need to go through the Matrix protocol, along with Effect-TS for robust side effect management.

## Features

### 1. Convex Backend

The Convex backend provides:

- **User Preferences**: Store UI preferences, themes, layouts, and custom settings
- **Room Metadata**: Custom room names, colors, favorites, pins, tags, and notes
- **Analytics**: Track user events and sessions for analytics
- **Feature Flags**: Dynamic feature rollout with A/B testing capabilities
- **Caching**: High-performance caching layer for frequently accessed data

### 2. Effect-TS Integration

Effect-TS provides:

- **Type-safe error handling**: All errors are typed and composable
- **Automatic cancellation**: Effects are cancelled when components unmount
- **Retry logic**: Built-in retry capabilities for failed operations
- **Timeout handling**: Automatic timeout support for long-running operations
- **Composability**: Chain and combine effects elegantly

## Setup

### 1. Install Dependencies

```bash
bun add convex effect
```

### 2. Configure Convex

Create a `.env.local` file with your Convex URL:

```env
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

### 3. Initialize Convex

Run the Convex development server:

```bash
bun run convex:dev
```

Deploy to production:

```bash
bun run convex:deploy
```

## Usage

### 1. Wrap Your App with ConvexProvider

```tsx
import { ConvexProvider } from "./effects/ConvexProvider";

function App() {
    return (
        <ConvexProvider convexUrl={import.meta.env.VITE_CONVEX_URL}>
            <YourApp />
        </ConvexProvider>
    );
}
```

### 2. Use Effect-TS Hooks

#### Fetch User Preferences

```tsx
import { useUserPreferences } from "./effects/examples/useUserPreferences";

function PreferencesPanel() {
    const { data: preferences, isLoading, error } = useUserPreferences(userId);

    if (isLoading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;

    return <div>Theme: {preferences?.theme}</div>;
}
```

#### Update User Preferences

```tsx
import { useUpdateUserPreferences } from "./effects/examples/useUserPreferences";

function ThemeSelector() {
    const { mutate: updatePreferences, isLoading } = useUpdateUserPreferences();

    const handleThemeChange = async (theme: string) => {
        await updatePreferences({
            userId: 'user123',
            theme,
        });
    };

    return <button onClick={() => handleThemeChange('dark')}>Dark Mode</button>;
}
```

#### Toggle Favorite Room

```tsx
import { useToggleFavorite } from "./effects/examples/useRoomMetadata";

function RoomListItem({ roomId, userId }: Props) {
    const { mutate: toggleFavorite, isLoading } = useToggleFavorite();

    return (
        <button
            onClick={() => toggleFavorite(roomId, userId)}
            disabled={isLoading}
        >
            ⭐ Favorite
        </button>
    );
}
```

#### Feature Flags

```tsx
import { useFeatureFlag } from "./effects/examples/useFeatureFlags";

function NewFeature() {
    const { data: isEnabled } = useFeatureFlag('new-ui', userId);

    if (!isEnabled) return null;

    return <div>New UI Feature</div>;
}
```

### 3. Create Custom Effect Hooks

```tsx
import { Effect } from "effect";
import { ConvexService } from "./effects/ConvexService";
import { useEffectQuery } from "./effects/hooks/useEffectQuery";

function useCustomOperation(params: Params) {
    return useEffectQuery(
        Effect.flatMap(ConvexService, (service) =>
            // Your custom operation
            service.someOperation(params)
        ),
        [params]
    );
}
```

### 4. Compose Effects

```tsx
import { Effect, pipe } from "effect";
import { ConvexService } from "./effects/ConvexService";

const complexOperation = pipe(
    Effect.flatMap(ConvexService, (service) =>
        service.getUserPreferences(userId)
    ),
    Effect.flatMap((prefs) =>
        Effect.flatMap(ConvexService, (service) =>
            service.trackEvent({
                userId,
                eventType: 'preferences_loaded',
                eventData: { theme: prefs?.theme }
            })
        )
    ),
    Effect.retry({ times: 3 }),
    Effect.timeout('5s')
);
```

## Convex Schema

### User Preferences

```typescript
{
    userId: string;
    theme?: string;
    language?: string;
    notifications?: {
        enabled: boolean;
        sound: boolean;
        desktop: boolean;
    };
    layout?: {
        sidebarCollapsed: boolean;
        rightPanelWidth?: number;
        messageLayout?: "modern" | "compact";
    };
    customSettings?: Record<string, any>;
}
```

### Room Metadata

```typescript
{
    roomId: string;
    userId: string;
    customName?: string;
    color?: string;
    isFavorite: boolean;
    isPinned: boolean;
    sortOrder?: number;
    tags?: string[];
    notes?: string;
}
```

### Feature Flags

```typescript
{
    name: string;
    enabled: boolean;
    rolloutPercentage: number; // 0-100
    targetUsers?: string[];
    description?: string;
}
```

## Benefits

### Compared to Traditional React Hooks

**Before (useAsyncMemo):**
```typescript
const [value, setValue] = useState<T | undefined>(initialValue);
useEffect(() => {
    let discard = false;
    fn().then((v) => {
        if (!discard) {
            setValue(v);
        }
    });
    return () => {
        discard = true;
    };
}, deps);
```

**After (useEffectQuery):**
```typescript
const { data: value } = useEffectQuery(effect, deps);
```

### Benefits:
1. **Automatic cancellation**: No manual `discard` flag needed
2. **Type-safe errors**: Errors are typed and handled properly
3. **Composable**: Chain and combine effects easily
4. **Retry logic**: Built-in retry capabilities
5. **Timeout support**: Automatic timeout handling
6. **Better testing**: Effects are easier to test in isolation

## API Reference

### Hooks

- `useEffectQuery<E, A>`: Run an Effect as a query with automatic dependency tracking
- `useEffectMutation<E, A>`: Run an Effect as a mutation
- `useUserPreferences`: Fetch user preferences
- `useUpdateUserPreferences`: Update user preferences
- `useRoomMetadata`: Fetch room metadata
- `useToggleFavorite`: Toggle room favorite status
- `useFeatureFlag`: Check if a feature is enabled

### Services

- `ConvexService`: Main service for Convex operations
- `ConvexServiceLive`: Live implementation using ConvexClient

### Errors

- `ConvexError`: Convex operation failed
- `NetworkError`: Network operation failed
- `ValidationError`: Validation failed
- `AuthError`: Authentication failed
- `NotFoundError`: Resource not found

## Migration Guide

### Migrating Existing Hooks

1. **Identify side effects**: Look for `useEffect` with async operations
2. **Convert to Effect**: Wrap async operations in `Effect.tryPromise`
3. **Use Effect hooks**: Replace with `useEffectQuery` or `useEffectMutation`
4. **Add error handling**: Use typed errors instead of try-catch
5. **Add retry/timeout**: Use Effect's built-in capabilities

### Example Migration

**Before:**
```typescript
function useMyData(id: string) {
    const [data, setData] = useState<Data | undefined>();
    const [error, setError] = useState<Error | undefined>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        fetchData(id)
            .then((result) => {
                if (!cancelled) {
                    setData(result);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err);
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    return { data, error, loading };
}
```

**After:**
```typescript
function useMyData(id: string) {
    return useEffectQuery(
        Effect.tryPromise({
            try: () => fetchData(id),
            catch: (error) => new NetworkError({
                message: 'Failed to fetch data',
                cause: error
            })
        }).pipe(
            Effect.retry({ times: 3 }),
            Effect.timeout('10s')
        ),
        [id]
    );
}
```

## Best Practices

1. **Use Effect for all async operations**: Wrap promises in `Effect.tryPromise`
2. **Type your errors**: Use custom error classes for different failure modes
3. **Compose effects**: Use `pipe` and Effect combinators for complex flows
4. **Add timeouts**: Always add timeouts to prevent hanging operations
5. **Use retry logic**: Add retry for transient failures
6. **Test effects**: Test effects in isolation before using in components
7. **Keep effects pure**: Effects should be deterministic and side-effect free

## Troubleshooting

### Effect not running
- Check that dependencies are correct
- Ensure `enabled` option is `true` (default)
- Verify the Effect runtime is initialized

### Type errors
- Ensure all errors extend `Data.TaggedError`
- Check that Effect types match hook signatures
- Verify service types are correctly defined

### Performance issues
- Use `useMemo` for complex Effect computations
- Avoid creating new Effects on every render
- Consider using `useCallback` for Effect factories

## Additional Resources

- [Effect-TS Documentation](https://effect.website/)
- [Convex Documentation](https://docs.convex.dev/)
- [Element Web Development Guide](./developer_guide.md)
