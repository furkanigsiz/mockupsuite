# Requirements Document

## Introduction

MockupSuite uygulamasına iyzico ödeme sistemi entegrasyonu eklenerek kullanıcıların farklı abonelik planları satın alabilmesi ve kredi bazlı ödeme yapabilmesi sağlanacaktır. Sistem, ücretsiz kullanıcılar için sınırlı özellikler, ücretli kullanıcılar için premium özellikler ve queue yönetimi içerecektir.

## Glossary

- **Payment_System**: İyzico API'si ile entegre ödeme işleme sistemi
- **Subscription_Manager**: Kullanıcı abonelik planlarını yöneten servis
- **Credit_System**: Kullanıcı kredi bakiyesini takip eden sistem
- **Queue_Manager**: Ücretsiz ve ücretli kullanıcılar için görüntü oluşturma sırasını yöneten sistem
- **User**: Uygulamayı kullanan kişi
- **Free_Tier_User**: Aylık 5 görüntü hakkı olan ücretsiz kullanıcı
- **Subscription_User**: Aylık abonelik planı olan kullanıcı
- **Credit_User**: Kredi satın alarak kullanım yapan kullanıcı
- **Render_Request**: Kullanıcının AI görüntü oluşturma talebi
- **Watermark**: Ücretsiz kullanıcıların görüntülerine eklenen "MockupSuite AI generated" işareti

## Requirements

### Requirement 1: Abonelik Planları Yönetimi

**User Story:** As a user, I want to choose from different subscription plans, so that I can access premium features based on my usage needs

#### Acceptance Criteria

1. THE Subscription_Manager SHALL store three subscription plans: Starter (₺299/ay, 50 görüntü), Pro (₺649/ay, 200 görüntü), Business (₺1199/ay, 700 görüntü)
2. WHEN a User selects a subscription plan, THE Payment_System SHALL initiate an iyzico payment transaction
3. WHEN a payment is successful, THE Subscription_Manager SHALL activate the subscription and credit the monthly image quota to the User account
4. THE Subscription_Manager SHALL track the subscription start date, end date, renewal date, and remaining image quota for each Subscription_User
5. WHEN a subscription period ends, THE Subscription_Manager SHALL automatically renew the subscription if auto-renewal is enabled

### Requirement 2: Kredi Bazlı Ödeme Sistemi

**User Story:** As a user, I want to purchase credits for pay-as-you-go usage, so that I can generate images without committing to a monthly subscription

#### Acceptance Criteria

1. THE Credit_System SHALL offer three credit packages: ₺25 (3 görüntü), ₺100 (15 görüntü), ₺250 (40 görüntü)
2. WHEN a User purchases credits, THE Payment_System SHALL process the payment through iyzico
3. WHEN credit purchase is successful, THE Credit_System SHALL add the purchased credits to the User balance
4. THE Credit_System SHALL deduct credits from User balance when a Render_Request is completed
5. WHEN User credit balance reaches zero, THE Credit_System SHALL prevent new Render_Request submissions until credits are purchased

### Requirement 3: Ücretsiz Katman (Free Tier)

**User Story:** As a new user, I want to try the service with limited free features, so that I can evaluate the product before purchasing

#### Acceptance Criteria

1. THE Subscription_Manager SHALL provide 5 free image generations per month to each Free_Tier_User
2. WHEN a Free_Tier_User generates an image, THE Payment_System SHALL apply a Watermark with text "MockupSuite AI generated"
3. THE Payment_System SHALL limit Free_Tier_User image resolution to 512px
4. WHEN a Free_Tier_User submits a Render_Request, THE Queue_Manager SHALL place the request in a lower priority queue
5. WHEN a Free_Tier_User exhausts their monthly quota, THE Subscription_Manager SHALL display upgrade options

### Requirement 4: Queue Yönetimi

**User Story:** As a paying user, I want priority processing for my image generation requests, so that I receive results faster than free users

#### Acceptance Criteria

1. THE Queue_Manager SHALL maintain two separate queues: priority queue for Subscription_User and Credit_User, standard queue for Free_Tier_User
2. WHEN a Render_Request is submitted, THE Queue_Manager SHALL route Subscription_User and Credit_User requests to the priority queue
3. THE Queue_Manager SHALL process priority queue requests before standard queue requests
4. THE Queue_Manager SHALL display estimated wait time to User based on their queue position
5. WHEN queue processing capacity is available, THE Queue_Manager SHALL process the next request from the priority queue first

### Requirement 5: İyzico Ödeme Entegrasyonu

**User Story:** As a user, I want to make secure payments through iyzico, so that I can purchase subscriptions and credits safely

#### Acceptance Criteria

1. THE Payment_System SHALL integrate with iyzico API for payment processing
2. WHEN a User initiates a payment, THE Payment_System SHALL create an iyzico checkout form with transaction details
3. THE Payment_System SHALL handle iyzico callback responses for successful and failed payments
4. WHEN a payment fails, THE Payment_System SHALL display the error message to User and allow retry
5. THE Payment_System SHALL store payment transaction records in the database with status, amount, and timestamp

### Requirement 6: Kullanıcı Hesap Yönetimi

**User Story:** As a user, I want to view my subscription status and usage statistics, so that I can track my spending and remaining quota

#### Acceptance Criteria

1. THE Subscription_Manager SHALL display current plan, renewal date, and remaining image quota on User dashboard
2. THE Credit_System SHALL display current credit balance and transaction history on User account page
3. WHEN a User views their account, THE Subscription_Manager SHALL show usage statistics for the current billing period
4. THE Subscription_Manager SHALL allow User to upgrade, downgrade, or cancel their subscription
5. WHEN a User cancels subscription, THE Subscription_Manager SHALL maintain access until the end of the current billing period

### Requirement 7: Fiyatlandırma ve Maliyet Hesaplama

**User Story:** As the system, I want to track costs and revenue per user, so that profitability can be monitored

#### Acceptance Criteria

1. THE Payment_System SHALL calculate per-image cost for each subscription plan: Starter (₺5.98/görsel), Pro (₺3.24/görsel), Business (₺1.71/görsel)
2. THE Payment_System SHALL track actual rendering costs (₺1.35 per image) for profit calculation
3. THE Payment_System SHALL store revenue and cost data for each transaction
4. THE Payment_System SHALL generate monthly revenue reports showing total subscriptions, credit sales, and profit margins
5. THE Payment_System SHALL track conversion rates from Free_Tier_User to paid plans

### Requirement 8: Watermark ve Çözünürlük Kontrolü

**User Story:** As a free user, I want to understand the limitations of my tier, so that I know what benefits I'll get by upgrading

#### Acceptance Criteria

1. WHEN a Free_Tier_User generates an image, THE Payment_System SHALL overlay a Watermark with "MockupSuite AI generated" text
2. THE Payment_System SHALL limit Free_Tier_User image output to 512px maximum dimension
3. WHEN a Subscription_User or Credit_User generates an image, THE Payment_System SHALL provide full resolution without Watermark
4. THE Payment_System SHALL display tier comparison information showing Free vs Paid features
5. THE Payment_System SHALL allow Free_Tier_User to preview full resolution by upgrading

### Requirement 9: Zorunlu Plan Seçimi ve Kayıt Akışı

**User Story:** As a new user, I want to select a subscription plan during registration, so that I can start using the service immediately

#### Acceptance Criteria

1. WHEN a User completes registration, THE Subscription_Manager SHALL display a plan selection screen before allowing access to the application
2. THE Subscription_Manager SHALL prevent User from accessing the main application until a plan is selected
3. THE Subscription_Manager SHALL offer four options during registration: Free Tier, Starter, Pro, or Business
4. WHEN a User selects Free Tier, THE Subscription_Manager SHALL activate the account immediately with 5 monthly image quota
5. WHEN a User selects a paid plan, THE Payment_System SHALL redirect to iyzico payment before activating the account

### Requirement 10: Kullanıcı Dashboard ve Kredi Görünürlüğü

**User Story:** As a user, I want to see my remaining credits and subscription status prominently, so that I know when to upgrade or renew

#### Acceptance Criteria

1. THE Subscription_Manager SHALL display a persistent status widget showing remaining image quota or credits
2. WHEN a Free_Tier_User views the dashboard, THE Subscription_Manager SHALL display remaining free images and monthly reset date
3. WHEN a Subscription_User views the dashboard, THE Subscription_Manager SHALL display remaining images in current billing period and renewal date
4. WHEN a Credit_User views the dashboard, THE Credit_System SHALL display current credit balance
5. THE Subscription_Manager SHALL display a prominent "Upgrade Now" button when User quota is below 20% or expired

### Requirement 11: Abonelik Yükseltme ve Yenileme Bildirimleri

**User Story:** As a user, I want to be notified when my subscription is about to expire, so that I can renew or upgrade without interruption

#### Acceptance Criteria

1. WHEN a Free_Tier_User exhausts their monthly quota, THE Subscription_Manager SHALL display an upgrade modal with plan options
2. WHEN a Subscription_User has 3 days remaining until renewal, THE Subscription_Manager SHALL display a renewal reminder notification
3. WHEN a subscription expires, THE Subscription_Manager SHALL downgrade User to Free Tier and display upgrade options
4. THE Subscription_Manager SHALL allow User to upgrade from any plan to a higher tier at any time
5. WHEN a User upgrades mid-billing cycle, THE Payment_System SHALL calculate prorated charges for the remaining period

