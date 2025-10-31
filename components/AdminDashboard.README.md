# Admin Dashboard

Admin dashboard for MockupSuite that provides analytics and reporting capabilities.

## Features

- **Revenue Reports**: Monthly revenue tracking with percentage changes
- **Active Subscriptions**: Count of active paid subscriptions
- **User Metrics**: New user registrations and conversion rates
- **Usage Statistics**: Total mockups generated
- **Top Users**: Users with highest usage
- **Payment Activity**: Recent payment transactions with success/failure status
- **Report Generation**: Export revenue, user, and subscription data as CSV

## Accessing the Admin Dashboard

To access the admin dashboard, add `?admin=true` to the URL:

```
http://localhost:3000/?admin=true
```

Or in production:

```
https://your-domain.com/?admin=true
```

## Security Considerations

**IMPORTANT**: This implementation does not include authentication checks for admin access. In production, you should:

1. Add an `is_admin` or `role` column to the `profiles` table
2. Check user role before rendering the admin dashboard
3. Implement RLS policies to restrict admin data access
4. Add server-side validation for admin operations

### Recommended Implementation

```typescript
// In AdminDashboard.tsx, add this check:
useEffect(() => {
  const checkAdminAccess = async () => {
    if (!user) return;
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      // Redirect to main app
      window.location.href = '/';
    }
  };
  
  checkAdminAccess();
}, [user]);
```

## Database Requirements

The admin dashboard queries the following tables:
- `payment_transactions`
- `subscriptions`
- `profiles`
- `usage_logs`

Ensure these tables exist and have proper RLS policies configured.

## Analytics Metrics

### Revenue Metrics
- Total revenue for current period
- Revenue change percentage vs previous period
- Revenue over time chart (last 30 days)

### Subscription Metrics
- Active paid subscriptions count
- Subscription change percentage
- Conversion rate (free to paid)

### User Metrics
- New users in current period
- User growth percentage
- Top users by usage

### Payment Metrics
- Payment success rate
- Recent payment activity
- Failed payment tracking

## Report Generation

The "Generate Report" button exports data as CSV files:
- Revenue report: All payment transactions
- User report: User registrations
- Subscription report: Subscription data

Reports include date range filtering (currently set to current month).

## Customization

### Changing the Date Range

Edit the `getAdminStats` function in `services/adminAnalyticsService.ts`:

```typescript
export async function getAdminStats(period: 'daily' | 'monthly' | 'yearly' = 'monthly')
```

### Adding New Metrics

1. Add the metric interface to `adminAnalyticsService.ts`
2. Create a function to fetch the data
3. Update the `AdminDashboard` component to display it

### Styling

The dashboard uses Tailwind CSS with a dark theme. Colors are defined in the design:
- Primary: `#2bcdee`
- Background: `#101f22`
- Cards: `bg-white/5` with `border-white/10`

## Performance Considerations

- Dashboard data is loaded on mount
- No automatic refresh (user must reload page)
- Consider adding caching for frequently accessed data
- For large datasets, implement pagination in the analytics service

## Future Enhancements

- Real-time updates using Supabase Realtime
- Date range picker for custom reports
- More detailed analytics (cohort analysis, retention, etc.)
- Export to PDF
- Email reports
- Dashboard widgets customization
- Multi-currency support
