# Implementation Plan: Unified Credit System

## Task List

- [ ] 1. Update database schema and create migration
  - Add subscription_credits and has_used_free_tier columns to subscriptions table
  - Modify credit_balances table to use payg_credits column
  - Update credit_transactions table with credit_source and generation_type columns
  - Update payment_transactions table with type column for subscription vs payg
  - Create Supabase migration SQL file
  - _Requirements: 1.1, 2.2, 3.6, 5.6, 7.6_

- [ ] 2. Update TypeScript type definitions
  - Update CreditBalance interface with subscriptionCredits, paygCredits, totalCredits, hasUsedFreeTier
  - Update CreditTransaction interface with creditSource and generationType fields
  - Add PaygCreditPackage interface
  - Update SubscriptionPlan interface with monthlyCredits and equivalent calculations
  - Add PAYG_CREDIT_PACKAGES constant array with pricing
  - Update SUBSCRIPTION_PLANS with monthlyCredits instead of monthlyQuota
  - Add CREDIT_COSTS constant for image and video costs
  - Add CreditErrorType enum
  - _Requirements: 1.1, 4.1, 5.3, 8.3_

- [ ] 3. Refactor creditService.ts for unified credit system
- [ ] 3.1 Implement getCreditBalance function
  - Query both subscriptions.subscription_credits and credit_balances.payg_credits
  - Calculate totalCredits as sum of both sources
  - Include hasUsedFreeTier flag from subscriptions table
  - Include nextResetDate from subscription for paid plans
  - _Requirements: 1.1, 1.4, 6.2_

- [ ] 3.2 Implement deductCredits function with priority logic
  - Accept userId, amount, and generationType parameters
  - Deduct from subscription_credits first
  - If insufficient, deduct remaining from payg_credits
  - Use database transaction for atomicity
  - Record transaction in credit_transactions with credit_source
  - Return breakdown of credits used from each source
  - _Requirements: 1.2, 1.3, 8.1, 8.2, 8.3_

- [ ] 3.3 Implement addPaygCredits function
  - Add credits to credit_balances.payg_credits
  - Record transaction with type='purchase' and credit_source='payg'
  - Link to payment_transaction_id
  - Invalidate credit cache
  - _Requirements: 5.4, 5.5_

- [ ] 3.4 Implement canGenerate validation function
  - Check total available credits against required amount
  - Return canGenerate boolean, requiredCredits, availableCredits
  - Include reason if insufficient
  - Use CREDIT_COSTS constant for image (1) and video (5)
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 3.5 Update getCreditTransactions function
  - Include credit_source and generation_type in query
  - Order by created_at descending
  - Support pagination with limit parameter
  - _Requirements: 6.4_

- [ ] 4. Refactor subscriptionService.ts for credit-based system
- [ ] 4.1 Update createSubscription function
  - Check has_used_free_tier flag before allowing free tier selection
  - Set has_used_free_tier=true for new free tier subscriptions
  - Set subscription_credits to plan.monthlyCredits
  - Throw error if free tier already used
  - _Requirements: 2.1, 2.2, 2.3, 4.5_

- [ ] 4.2 Implement canSelectFreeTier function
  - Query subscriptions.has_used_free_tier for user
  - Return false if flag is true
  - Return true if user has never had subscription
  - _Requirements: 2.3, 2.5_

- [ ] 4.3 Update renewSubscription function
  - Only reset subscription_credits for paid plans (not free tier)
  - Preserve payg_credits during reset
  - Record reset transaction with credit_source='subscription'
  - _Requirements: 3.1, 3.2, 3.5, 3.6_

- [ ] 4.4 Update upgradeSubscription function
  - Set subscription_credits to new plan monthlyCredits
  - Preserve payg_credits
  - Set has_used_free_tier=true if upgrading from free
  - _Requirements: 2.4, 3.4, 3.5_

- [ ] 4.5 Remove or deprecate quota-related functions
  - Remove getRemainingQuota function
  - Remove decrementQuota function
  - Remove resetMonthlyQuota function
  - Remove decrementVideoQuota function
  - Remove getVideoQuotaInfo function
  - Update canGenerateImage to use creditService.canGenerate
  - Update canGenerateVideo to use creditService.canGenerate
  - _Requirements: 1.1_

- [ ] 5. Update paymentService.ts for pay-as-you-go credits
- [ ] 5.1 Implement initiateCreditPurchase function
  - Accept userId, packageId, callbackUrl
  - Find package from PAYG_CREDIT_PACKAGES
  - Create payment_transaction with type='payg'
  - Call Iyzico API with package price
  - Return checkout form content and token
  - _Requirements: 5.1, 5.3, 9.5_

- [ ] 5.2 Implement processCreditPurchaseCallback function
  - Verify payment status with Iyzico
  - Update payment_transaction status
  - Call creditService.addPaygCredits on success
  - Return success status and new balance
  - _Requirements: 5.4, 5.5_

- [ ] 5.3 Update existing payment functions
  - Ensure subscription payments set type='subscription'
  - Maintain backward compatibility with existing flows
  - _Requirements: 5.6_

- [ ] 6. Create migrationService.ts for data migration
- [ ] 6.1 Implement migrateToCredits function
  - Query all users with subscriptions
  - For each user, call migrateUser function
  - Collect and return errors
  - Log migration progress
  - _Requirements: 7.7_

- [ ] 6.2 Implement migrateUser function
  - Convert remaining_quota to subscription_credits (1:1 ratio)
  - Set has_used_free_tier based on current plan_id
  - Convert existing credit_balances.balance to payg_credits
  - Create migration transaction log
  - Use database transaction for atomicity
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7. Update UnifiedHeader.tsx component
  - Fetch credit balance using creditService.getCreditBalance
  - Display total credits in header
  - Add credit icon and styling
  - Update on credit changes
  - _Requirements: 6.1_

- [ ] 8. Update ProfilePage.tsx component
- [ ] 8.1 Add CreditBreakdown component
  - Display subscription_credits with reset date
  - Display payg_credits with "never expires" label
  - Display total available credits
  - Show visual distinction between credit types
  - _Requirements: 6.2, 6.6_

- [ ] 8.2 Update credit transaction history display
  - Show credit_source (subscription vs payg) for each transaction
  - Show generation_type (image vs video) for deductions
  - Add icons or badges for transaction types
  - _Requirements: 6.4_

- [ ] 9. Update PaymentCheckout.tsx component
- [ ] 9.1 Add pay-as-you-go section
  - Create CreditPackageCard component
  - Display PAYG_CREDIT_PACKAGES in grid layout
  - Show credits, price, and equivalent images/videos
  - Add "Never expires" badge
  - _Requirements: 5.2, 9.2, 9.3, 9.4_

- [ ] 9.2 Update subscription section
  - Display monthlyCredits instead of monthlyQuota
  - Show equivalent images and videos
  - Disable free tier option if has_used_free_tier is true
  - Add tooltip explaining free tier limitation
  - _Requirements: 2.3, 4.1, 4.4, 4.6_

- [ ] 9.3 Implement credit package purchase flow
  - Handle package selection
  - Call paymentService.initiateCreditPurchase
  - Display Iyzico checkout form
  - Handle callback and update balance
  - _Requirements: 9.5_

- [ ] 10. Update GeneratorControls.tsx component
  - Call creditService.canGenerate before generation
  - Show credit cost (1 credit) in UI
  - Display insufficient credits modal if needed
  - Show options to purchase credits or upgrade
  - Prevent generation if validation fails
  - _Requirements: 1.2, 6.3, 10.1, 10.3, 10.4, 10.5_

- [ ] 11. Update VideoGeneratorControls.tsx component
  - Call creditService.canGenerate with 'video' type
  - Show credit cost (5 credits) in UI
  - Display insufficient credits modal if needed
  - Show options to purchase credits or upgrade
  - Prevent generation if validation fails
  - _Requirements: 1.3, 6.3, 10.2, 10.3, 10.4, 10.5_

- [ ] 12. Create InsufficientCreditsModal component
  - Display current balance and required credits
  - Show reason for insufficient credits
  - Provide "Purchase Credits" button linking to pay-as-you-go
  - Provide "Upgrade Plan" button linking to subscriptions
  - _Requirements: 10.3, 10.4, 9.7_

- [ ] 13. Update SubscriptionSection.tsx component
  - Display credit balance breakdown
  - Show next reset date for subscription credits
  - Update plan display to show monthlyCredits
  - Add link to pay-as-you-go section
  - _Requirements: 6.5, 6.6_

- [ ] 14. Update QuotaWidget.tsx component
  - Rename to CreditWidget.tsx
  - Display total credits instead of quota
  - Show credit breakdown on hover or click
  - Update styling and labels
  - _Requirements: 1.4, 6.1_

- [ ] 15. Update translation files
- [ ] 15.1 Update en.ts with credit terminology
  - Replace quota terms with credit terms
  - Add pay-as-you-go translations
  - Add credit breakdown labels
  - Add insufficient credits messages
  - Add free tier limitation messages
  - _Requirements: 1.5, 2.3, 5.10, 6.6, 10.3_

- [ ] 15.2 Update tr.ts with credit terminology
  - Translate all new credit-related strings to Turkish
  - Ensure consistency with existing Turkish translations
  - _Requirements: 1.5, 2.3, 5.10, 6.6, 10.3_

- [ ] 15.3 Update es.ts with credit terminology
  - Translate all new credit-related strings to Spanish
  - Ensure consistency with existing Spanish translations
  - _Requirements: 1.5, 2.3, 5.10, 6.6, 10.3_

- [ ] 16. Update geminiService.ts and veo3Service.ts
  - Replace quota deduction calls with creditService.deductCredits
  - Pass generationType ('image' or 'video')
  - Handle credit deduction errors
  - _Requirements: 1.2, 1.3, 8.1_

- [ ] 17. Update cacheService.ts
  - Add invalidateCredits function
  - Update cache keys for credit-related data
  - Set appropriate TTL for credit balance cache (1 minute)
  - _Requirements: 6.1_

- [ ] 18. Create and run database migration
  - Execute migration SQL on Supabase
  - Verify schema changes applied correctly
  - Run migrationService.migrateToCredits for existing users
  - Verify data migration completed successfully
  - Create rollback plan if needed
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 19. Update error handling
  - Add credit error types to errorHandling.ts
  - Implement handleCreditError function
  - Update error messages for credit-related failures
  - Add user-friendly error messages with suggested actions
  - _Requirements: 1.5, 2.3, 10.3_

- [ ] 20. Integration testing
  - Test complete image generation flow with credit deduction
  - Test complete video generation flow with credit deduction
  - Test subscription purchase and credit allocation
  - Test pay-as-you-go purchase and credit addition
  - Test credit reset for paid subscriptions
  - Test free tier lock enforcement
  - Test credit deduction priority (subscription first)
  - Test insufficient credits handling
  - Verify all UI components display correct credit information
  - _Requirements: All_
