# Quota and Queue System

## Overview

The quota and queue system manages image generation limits, priority queuing, and real-time quota tracking for users based on their subscription plans.

## Architecture

### Components

1. **QuotaWidget**: UI component displaying quota information
2. **queueManagerService**: Manages render queue and priority
3. **subscriptionService**: Tracks quota usage and limits
4. **render_queue table**: Database table for queuing render requests

## QuotaWidget Integration (Task 15)

### Implementation Details

**Location**: Integrated into `AppHeader.tsx` component

**Features**:
- ✅ Compact button view in header (always visible)
- ✅ Click-to-expand dropdown with full details
- ✅ Real-time quota updates after image generation
- ✅ Upgrade button integration with UpgradeModal
- ✅ Persistent across all pages (sticky header)

**Component Structure**:
```typescript
// AppHeader.tsx
const [showQuotaDetails, setShowQuotaDetails] = useState(false);
const quotaRef = useRef<HTMLDivElement>(null);

// Compact button
<button onClick={() => setShowQuotaDetails(!showQuotaDetails)}>
  <BarChartIcon />
  <span>Quota</span>
</button>

// Expanded dropdown
{showQuotaDetails && (
  <div className="dropdown">
    <QuotaWidget 
      onUpgradeClick={onUpgradeClick}
      refreshTrigger={quotaRefreshTrigger}
    />
  </div>
)}
```

**Real-time Updates**:
```typescript
// App.tsx - After successful generation
await subscriptionService.decrementQuota(user.id, 1);
setQuotaRefreshTrigger(prev => prev + 1); // Triggers refresh

// QuotaWidget.tsx - Listens to trigger
useEffect(() => {
  if (refreshTrigger !== undefined && refreshTrigger > 0) {
    loadQuotaData(); // Refresh quota info
  }
}, [refreshTrigger]);
```

**Auto-refresh**:
- Polls every 30 seconds for background updates
- Immediate refresh on generation completion
- Refresh on trigger prop change

## Render Queue System

### Database Schema

**Table**: `render_queue`

**Columns**:
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to profiles)
- `project_id` (uuid, nullable, foreign key to projects)
- `status` (enum: pending, processing, completed, failed)
- `priority` (text: 'low' or 'high')
- `prompt` (text, NOT NULL) - **Separate column**
- `input_images` (text[], NOT NULL) - **Separate column**
- `aspect_ratio` (text, default '1:1') - **Separate column**
- `output_image_path` (text, nullable)
- `error_message` (text, nullable)
- `request_data` (jsonb) - **JSONB column for flexible data**
- `result_data` (jsonb, nullable)
- `created_at`, `started_at`, `completed_at` (timestamps)

**Key Insight**: Schema uses BOTH separate columns AND JSONB columns:
- Separate columns: For database queries, constraints, and indexing
- JSONB columns: For flexible data storage and backward compatibility

### Critical Bug Fix (2025-10-31)

**Problem**: 
```
Failed to add to queue: null value in column "prompt" of relation "render_queue" violates not-null constraint
```

**Root Cause**:
- Code only populated `request_data` JSONB column
- Did not populate separate `prompt` and `input_images` columns
- These columns have NOT NULL constraints

**Solution**:
```typescript
// queueManagerService.ts - addToQueue()
const insertData = {
  user_id: request.userId,
  project_id: request.projectId,
  priority,
  status: 'pending',
  // CRITICAL: Populate separate columns
  prompt: request.prompt.trim(),
  input_images: request.images,
  aspect_ratio: request.aspectRatio || '1:1',
  // Also populate JSONB for backward compatibility
  request_data: {
    prompt: request.prompt.trim(),
    images: request.images,
    aspectRatio: request.aspectRatio,
  },
};
```

**Validation Added**:
```typescript
// Validate prompt before adding to queue
if (!request.prompt || !request.prompt.trim()) {
  throw new Error('Prompt is required and cannot be empty');
}
```

**Debug Logging**:
```typescript
console.log('Adding to queue with data:', {
  userId: insertData.user_id,
  projectId: insertData.project_id,
  prompt: insertData.request_data.prompt,
  promptLength: insertData.request_data.prompt.length,
  imagesCount: insertData.request_data.images.length,
});
```

### Queue Priority System

**Priority Levels**:
- `high`: Paid subscription users (Starter, Pro, Business)
- `low`: Free tier users

**Priority Logic**:
```typescript
export async function getUserPriority(userId: string): Promise<QueuePriority> {
  const subscription = await getCurrentPlan(userId);
  
  if (subscription && subscription.status === 'active') {
    if (subscription.planId === 'free') {
      return 'low';
    }
    return 'high';
  }
  
  // Check if user has credits
  const creditBalance = await getCreditBalance(userId);
  if (creditBalance > 0) {
    return 'high';
  }
  
  return 'low';
}
```

**Queue Processing**:
1. High priority requests processed first
2. Within same priority, FIFO (first in, first out)
3. Status transitions: pending → processing → completed/failed

### Integration with Generation Flow

**Scene Generation**:
```typescript
// App.tsx - handleSceneGenerate()
for (let i = 0; i < images.length; i++) {
  // 1. Add to queue
  const queueItem = await queueManagerService.addToQueue({
    userId: user.id,
    projectId: currentProject.id,
    prompt: fullPrompt,
    images: [image.base64],
    aspectRatio: currentProject.aspectRatio,
  });

  // 2. Generate mockup
  let generated = await generateMockup(fullPrompt, image.base64, image.type);

  // 3. Update queue status
  await queueManagerService.updateQueueItemStatus(
    queueItem.id,
    'completed',
    { generatedImages: generated }
  );

  // 4. Decrement quota and trigger refresh
  await subscriptionService.decrementQuota(user.id, 1);
  setQuotaRefreshTrigger(prev => prev + 1);
}
```

**Product Generation**:
```typescript
// App.tsx - handleProductGenerate()
const queueItem = await queueManagerService.addToQueue({
  userId: user.id,
  projectId: currentProject?.id,
  prompt: prompt.trim(),
  images: [designImage.base64],
  aspectRatio: '1:1',
});

let generated = await generateMockup(prompt, designImage.base64, designImage.type);

await queueManagerService.updateQueueItemStatus(
  queueItem.id,
  'completed',
  { generatedImages: generated }
);

await subscriptionService.decrementQuota(user.id, 1);
setQuotaRefreshTrigger(prev => prev + 1);
```

## Quota Management

### Quota Tracking

**Database**: `subscriptions` table
- `remaining_quota`: Current available quota
- `monthly_render_quota`: Total quota for plan (reset monthly)
- `current_period_start`: Start of billing period
- `current_period_end`: End of billing period
- `quota_reset_date`: When quota resets

### Quota Operations

**Check if user can generate**:
```typescript
export async function canGenerateImage(userId: string): Promise<boolean> {
  const subscription = await getCurrentPlan(userId);
  
  // Check subscription quota
  if (subscription && subscription.remainingQuota > 0) {
    return true;
  }
  
  // Check credit balance
  const credits = await getCreditBalance(userId);
  if (credits > 0) {
    return true;
  }
  
  return false;
}
```

**Decrement quota**:
```typescript
export async function decrementQuota(userId: string, amount: number = 1): Promise<void> {
  const subscription = await getCurrentPlan(userId);
  
  if (!subscription) {
    throw new Error('No active subscription found');
  }
  
  if (subscription.remainingQuota >= amount) {
    // Use subscription quota
    await supabase
      .from('subscriptions')
      .update({ 
        remaining_quota: subscription.remainingQuota - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } else {
    // Use credits
    await deductCredits(userId, amount);
  }
}
```

### Quota Display

**QuotaWidget shows**:
- Plan name and price
- Remaining quota / Total quota
- Progress bar (color-coded: green > 50%, yellow 20-50%, red < 20%)
- Used mockups count
- Renewal/reset date
- Credit balance (if any)
- Upgrade button (if quota low or expired)
- Warning messages (low quota, exhausted)

**Color Coding**:
```typescript
const getProgressColor = () => {
  if (quotaPercentage > 50) return 'bg-green-500';
  if (quotaPercentage >= 20) return 'bg-yellow-500';
  return 'bg-red-500';
};
```

## Best Practices

### When Adding to Queue

1. ✅ Always validate prompt is not empty
2. ✅ Populate BOTH separate columns AND JSONB columns
3. ✅ Use `.trim()` on prompt to remove whitespace
4. ✅ Provide default aspect_ratio if not specified
5. ✅ Add debug logging for troubleshooting
6. ✅ Handle errors gracefully with user-friendly messages

### When Updating Quota

1. ✅ Check quota before generation
2. ✅ Decrement quota after successful generation
3. ✅ Trigger QuotaWidget refresh after decrement
4. ✅ Handle both subscription quota and credits
5. ✅ Show upgrade modal if quota exhausted

### When Displaying Quota

1. ✅ Show real-time updates
2. ✅ Use color coding for visual feedback
3. ✅ Provide clear upgrade path
4. ✅ Display renewal date
5. ✅ Show credit balance if available

## Troubleshooting

### Common Issues

**Issue**: "null value in column 'prompt' violates not-null constraint"
**Solution**: Ensure both separate columns and JSONB columns are populated

**Issue**: QuotaWidget not updating after generation
**Solution**: Check that `quotaRefreshTrigger` is being incremented and passed to widget

**Issue**: User can generate despite no quota
**Solution**: Verify `canGenerateImage()` is called before generation

**Issue**: Quota not resetting at period end
**Solution**: Check `quota_reset_date` and implement reset logic

### Debugging Tools

**MCP Supabase Tools**:
```typescript
// List tables and inspect schema
mcp_supabase_list_tables({ schemas: ['public'] })

// Execute SQL to check queue
mcp_supabase_execute_sql({ 
  query: 'SELECT * FROM render_queue WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10' 
})

// Check subscription quota
mcp_supabase_execute_sql({ 
  query: 'SELECT * FROM subscriptions WHERE user_id = $1' 
})
```

**Console Logging**:
- Enable debug logs in queueManagerService
- Check browser console for quota updates
- Monitor network tab for Supabase requests

## Future Enhancements

### Potential Improvements

1. **Real-time Queue Updates**
   - Use Supabase real-time subscriptions
   - Show queue position to users
   - Estimated wait time display

2. **Quota Analytics**
   - Usage history charts
   - Peak usage times
   - Quota utilization trends

3. **Smart Quota Management**
   - Rollover unused quota
   - Bonus quota for referrals
   - Temporary quota boosts

4. **Queue Optimization**
   - Batch processing for efficiency
   - Dynamic priority adjustment
   - Load balancing across servers

5. **Enhanced QuotaWidget**
   - Mini chart showing usage over time
   - Notifications for low quota
   - Quick credit purchase button
   - Plan comparison on hover
