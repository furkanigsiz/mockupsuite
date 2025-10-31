# QuotaWidget Component

## Overview

The `QuotaWidget` component displays the user's current subscription plan, remaining quota, credit balance, and renewal information. It provides real-time updates and visual indicators for quota status.

## Features

- **Plan Display**: Shows the current subscription plan name and price
- **Quota Progress Bar**: Visual representation of remaining quota with color coding:
  - Green: >50% remaining
  - Yellow: 20-50% remaining
  - Red: <20% remaining
- **Renewal Date**: Displays when the quota will reset or subscription will renew
- **Credit Balance**: Shows available credits (if user has purchased credits)
- **Upgrade Button**: Appears when quota is low (<20%) or subscription is expired
- **Real-time Updates**: Automatically refreshes every 30 seconds
- **Warning Messages**: Shows alerts when quota is running low or exhausted

## Usage

### Basic Usage

```tsx
import QuotaWidget from './components/QuotaWidget';

function Dashboard() {
  return (
    <div>
      <QuotaWidget />
    </div>
  );
}
```

### With Upgrade Handler

```tsx
import QuotaWidget from './components/QuotaWidget';
import { useState } from 'react';

function Dashboard() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <div>
      <QuotaWidget onUpgradeClick={() => setShowUpgradeModal(true)} />
      
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
```

### Integration in AppHeader

```tsx
import AppHeader from './components/AppHeader';
import QuotaWidget from './components/QuotaWidget';

function App() {
  return (
    <div>
      <AppHeader activeView="generator" onNavigate={() => {}} />
      
      {/* Sidebar or Dashboard */}
      <div className="flex">
        <aside className="w-64 p-4">
          <QuotaWidget onUpgradeClick={() => console.log('Upgrade clicked')} />
        </aside>
        
        <main className="flex-1">
          {/* Main content */}
        </main>
      </div>
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onUpgradeClick` | `() => void` | No | Callback function when the upgrade button is clicked |

## Styling

The component uses Tailwind CSS classes and supports dark mode. It's designed to be responsive and can be placed in sidebars, dashboards, or headers.

### Recommended Container Width

- Minimum: 240px
- Recommended: 280px - 320px
- Maximum: 400px

## Requirements

The component requires:
- User to be authenticated (uses `useAuth` hook)
- Subscription service to be configured
- Credit service to be configured
- Supabase database with `subscriptions` and `credit_balances` tables

## Related Components

- `PlanSelectionModal`: For initial plan selection
- `UpgradeModal`: For upgrading subscription plans
- `PaymentCheckout`: For processing payments

## Translations

The component uses the following translation keys:
- `quota_widget_active_plan`
- `quota_widget_remaining_quota`
- `quota_widget_renewal_date`
- `quota_widget_credit_balance`
- `quota_widget_upgrade_now`
- `quota_widget_renew_plan`
- `quota_widget_low_quota_warning`
- `quota_widget_exhausted_warning`

Make sure these keys are defined in your locale files (`locales/en.ts`, `locales/tr.ts`, `locales/es.ts`).
