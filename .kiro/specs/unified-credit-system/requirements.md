# Requirements Document

## Introduction

This document specifies the requirements for transitioning from a dual quota/credit system to a unified credit-based system for MockupSuite. The system will use a single credit balance for both image and video generation, with different credit costs for each operation type. Users can obtain credits through monthly subscriptions (which provide credits at the start of each billing period) or through pay-as-you-go credit purchases. The free tier will be a one-time offering per user, with no credit resets for free tier users.

## Glossary

- **Credit System**: A unified balance system where users consume credits for generating images and videos
- **Image Generation**: Creating AI-generated product mockups or scenes, costs 1 credit per image
- **Video Generation**: Creating AI-generated videos from images, costs 5 credits per video
- **Free Tier**: A one-time starter plan that provides initial credits to new users
- **Subscription Plan**: A recurring monthly plan that provides a fixed amount of credits at the start of each billing period
- **Credit Reset**: The process of replenishing subscription credits at the start of a new billing period (applies only to paid subscription plans, not free tier)
- **Pay-as-you-go Credits**: Credits purchased separately from subscriptions that do not expire or reset
- **Subscription Credits**: Credits provided by monthly subscription plans that reset at the start of each billing period
- **User Account**: A registered user profile identified by user_id
- **Free Tier Lock**: A permanent flag preventing users from selecting the free tier after their initial use

## Requirements

### Requirement 1: Unified Credit System

**User Story:** As a user, I want a single credit balance that I can use for both images and videos, so that I have flexibility in how I use my resources

#### Acceptance Criteria

1. THE System SHALL maintain a single credit balance per user account
2. WHEN a user generates an image, THE System SHALL deduct 1 credit from the user balance
3. WHEN a user generates a video, THE System SHALL deduct 5 credits from the user balance
4. THE System SHALL display the current credit balance to authenticated users
5. IF the user balance is less than the required credits, THEN THE System SHALL prevent the generation operation and display an insufficient credits message

### Requirement 2: One-Time Free Tier

**User Story:** As a platform owner, I want to ensure each user can only use the free tier once, so that we prevent abuse and encourage paid subscriptions

#### Acceptance Criteria

1. WHEN a new user registers, THE System SHALL automatically assign the free tier plan with initial credits
2. THE System SHALL record a permanent flag indicating the user has used their free tier
3. WHEN a user with an active free tier flag attempts to select the free tier plan, THE System SHALL prevent the selection and display a message indicating free tier is only available once
4. THE System SHALL allow users to upgrade from free tier to any paid plan
5. WHEN a user downgrades or cancels a paid subscription, THE System SHALL NOT allow them to return to the free tier

### Requirement 3: Credit Reset for Paid Subscriptions Only

**User Story:** As a paying subscriber, I want my subscription credits to reset each month, so that I can continue using the service without running out

#### Acceptance Criteria

1. WHEN a paid subscription period ends, THE System SHALL reset the user subscription credits to the plan monthly credit allocation
2. WHEN a free tier subscription period ends, THE System SHALL NOT reset the user subscription credits
3. THE System SHALL maintain pay-as-you-go credits across all billing periods regardless of subscription status
4. WHEN a user upgrades from free tier to a paid plan, THE System SHALL set the subscription credits to the new plan monthly allocation
5. THE System SHALL preserve existing pay-as-you-go credits when resetting subscription credits
6. THE System SHALL record credit reset events in the usage logs with the plan identifier, reset reason, and credit type

### Requirement 4: Subscription Plan Credit Allocation

**User Story:** As a user selecting a subscription plan, I want to know how many credits I will receive monthly, so that I can choose the right plan for my needs

#### Acceptance Criteria

1. THE System SHALL display the monthly credit allocation for each subscription plan
2. THE System SHALL display the credit cost for image generation as 1 credit per image
3. THE System SHALL display the credit cost for video generation as 5 credits per video
4. WHEN a user selects a subscription plan, THE System SHALL show the equivalent number of images and videos they can generate with the monthly credits
5. THE System SHALL update the user subscription credit balance immediately upon successful plan activation
6. THE System SHALL clearly indicate that subscription credits reset monthly while pay-as-you-go credits do not expire

### Requirement 5: Pay-as-you-go Credit Purchase

**User Story:** As a user who has exhausted my subscription credits, I want to purchase additional credits through pay-as-you-go, so that I can continue generating content without upgrading my plan

#### Acceptance Criteria

1. THE System SHALL allow users to purchase credit packages independently of their subscription status
2. THE System SHALL display pay-as-you-go credit packages in the payment methods section alongside subscription plans
3. THE System SHALL offer multiple credit package sizes with different price points
4. WHEN a user purchases pay-as-you-go credits, THE System SHALL add the purchased credits to their existing balance
5. THE System SHALL record credit purchase transactions with the payment identifier, credit amount, and transaction type as pay-as-you-go
6. THE System SHALL maintain pay-as-you-go credits separately from subscription credits in the database
7. THE System SHALL NOT reset or expire pay-as-you-go credits at the end of billing periods
8. WHEN a user generates content, THE System SHALL deduct credits from the combined balance of subscription and pay-as-you-go credits
9. THE System SHALL display the total available credits as a single balance to the user
10. THE System SHALL clearly label credit packages as pay-as-you-go to distinguish them from subscription plans

### Requirement 6: Credit Balance Display

**User Story:** As a user, I want to see my current credit balance and usage breakdown, so that I can track my consumption and plan accordingly

#### Acceptance Criteria

1. THE System SHALL display the total available credit balance in the application header
2. THE System SHALL display the credit balance breakdown on the user profile page showing subscription credits and pay-as-you-go credits separately
3. THE System SHALL show the credit cost before each generation operation
4. WHEN a user views their profile, THE System SHALL display their credit transaction history with transaction type indicators
5. THE System SHALL show the next credit reset date for paid subscription users
6. THE System SHALL indicate which credits will reset and which are permanent in the balance display

### Requirement 7: Migration from Existing System

**User Story:** As an existing user, I want my current quota to be converted to credits, so that I can continue using the service without disruption

#### Acceptance Criteria

1. THE System SHALL convert existing remaining_quota values to subscription credits using a 1:1 ratio
2. THE System SHALL preserve existing subscription status and billing periods during migration
3. THE System SHALL set the free tier lock flag for all existing users based on their current plan
4. WHEN an existing free tier user is migrated, THE System SHALL set their free tier lock to true
5. THE System SHALL convert existing credit_balances table records to pay-as-you-go credits
6. THE System SHALL create separate tracking for subscription credits and pay-as-you-go credits in the database
7. THE System SHALL log all migration operations with user identifier, converted credit amounts, and credit types

### Requirement 8: Credit Deduction Priority

**User Story:** As a user with both subscription and pay-as-you-go credits, I want the system to use my subscription credits first, so that I can maximize the value of my monthly subscription

#### Acceptance Criteria

1. WHEN a user generates content, THE System SHALL deduct credits from subscription credits first
2. IF subscription credits are insufficient, THEN THE System SHALL deduct the remaining cost from pay-as-you-go credits
3. THE System SHALL record which credit type was used in the transaction log
4. THE System SHALL display a warning when subscription credits are depleted and pay-as-you-go credits are being used
5. THE System SHALL prevent generation if the combined balance is insufficient for the operation cost

### Requirement 9: Payment Interface for Credit Purchases

**User Story:** As a user, I want to easily see and purchase both subscription plans and pay-as-you-go credits in one place, so that I can choose the best option for my needs

#### Acceptance Criteria

1. THE System SHALL display subscription plans and pay-as-you-go credit packages in the same payment interface
2. THE System SHALL organize the payment interface with clear sections for subscriptions and pay-as-you-go options
3. THE System SHALL display credit package options with credit amounts and prices
4. THE System SHALL show the equivalent number of images and videos for each credit package
5. WHEN a user selects a credit package, THE System SHALL initiate the payment flow using the existing payment service
6. THE System SHALL display pay-as-you-go credit packages on the profile page payment section
7. THE System SHALL show pay-as-you-go options when a user has insufficient credits for generation

### Requirement 10: Credit Validation Before Generation

**User Story:** As a user, I want to be notified before starting a generation if I don't have enough credits, so that I don't waste time setting up a generation that will fail

#### Acceptance Criteria

1. WHEN a user initiates an image generation, THE System SHALL verify the user has at least 1 credit available
2. WHEN a user initiates a video generation, THE System SHALL verify the user has at least 5 credits available
3. IF the user has insufficient credits, THEN THE System SHALL display the current balance and required credits
4. IF the user has insufficient credits, THEN THE System SHALL provide options to purchase credits or upgrade subscription
5. THE System SHALL prevent the generation API call if credit validation fails
