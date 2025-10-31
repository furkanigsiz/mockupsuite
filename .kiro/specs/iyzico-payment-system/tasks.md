# Implementation Plan - İyzico Payment System

## Overview

Bu implementation plan, iyzico ödeme sistemi entegrasyonunu adım adım kod yazma görevlerine böler. Her görev, önceki görevler üzerine inşa edilir ve sonunda tam entegre bir ödeme sistemi oluşturur.

## Tasks

- [x] 1. Veritabanı şeması ve migration'ları oluştur






  - Supabase'de yeni tablolar oluştur: subscriptions, credit_balances, credit_transactions, payment_transactions, render_queue, usage_logs
  - RLS policies ekle (her tablo için SELECT, INSERT, UPDATE, DELETE)
  - Database functions oluştur: create_free_subscription trigger, reset_expired_quotas function
  - Index'leri ekle (performans için)
  - _Requirements: 1.1, 1.4, 2.3, 6.1, 6.3, 7.3_

- [x] 2. TypeScript type definitions ve constants




  - types.ts dosyasına yeni interface'leri ekle: SubscriptionPlan, UserSubscription, CreditPackage, CreditBalance, PaymentTransaction, QueueItem
  - Subscription plan constants tanımla (free, starter, pro, business)
  - Credit package constants tanımla (small, medium, large)
  - Payment ve error type enum'ları oluştur
  - _Requirements: 1.1, 2.1, 7.1_

- [x] 3. Payment Service implementasyonu





  - services/paymentService.ts oluştur
  - İyzico API client konfigürasyonu (API key, secret, base URL)
  - initializePayment metodu: iyzico checkout form oluştur
  - verifyPayment metodu: ödeme doğrulama
  - handleCallback metodu: iyzico callback işleme
  - createSubscriptionPayment metodu: abonelik ödemesi
  - createCreditPayment metodu: kredi ödemesi
  - getPaymentHistory metodu: ödeme geçmişi
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Subscription Service implementasyonu





  - services/subscriptionService.ts oluştur
  - getAvailablePlans metodu: plan listesi döndür
  - getCurrentPlan metodu: kullanıcının mevcut planını getir
  - createSubscription metodu: yeni abonelik oluştur
  - upgradeSubscription metodu: plan yükseltme (prorated hesaplama)
  - cancelSubscription metodu: abonelik iptali
  - renewSubscription metodu: otomatik yenileme
  - getRemainingQuota metodu: kalan kota sorgula
  - decrementQuota metodu: kota azalt
  - resetMonthlyQuota metodu: aylık kota sıfırlama
  - canGenerateImage metodu: görüntü oluşturma izni kontrolü
  - requiresUpgrade metodu: yükseltme gerekli mi kontrolü
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Credit Service implementasyonu





  - services/creditService.ts oluştur
  - getCreditBalance metodu: kredi bakiyesi getir
  - addCredits metodu: kredi ekle (ödeme sonrası)
  - deductCredits metodu: kredi düş (görüntü oluşturma)
  - getAvailablePackages metodu: kredi paketleri listesi
  - purchaseCredits metodu: kredi satın alma
  - getCreditTransactions metodu: kredi işlem geçmişi
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Queue Manager Service implementasyonu




  - services/queueManagerService.ts oluştur
  - addToQueue metodu: render isteğini kuyruğa ekle
  - getQueuePosition metodu: kuyruk pozisyonu sorgula
  - processNextRequest metodu: sıradaki isteği işle
  - getQueueStatus metodu: kuyruk durumu
  - estimateWaitTime metodu: tahmini bekleme süresi
  - getUserPriority metodu: kullanıcı önceliği (free=low, paid=high)
  - Supabase Realtime subscription ekle (queue updates için)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Site ismi değişikliği





  - Site ismini "MockupSuite" Olarak değiştir gerekli her yerde
  - Bitirdikten sonra kontrol et atladığın yer kalmış mı diye

- [x] 7. Watermark Service implementasyonu





  - services/watermarkService.ts oluştur
  - addWatermark metodu: Canvas API ile "MockupSuite AI generated" watermark ekle
  - shouldApplyWatermark metodu: kullanıcı free tier mi kontrol et
  - resizeImage metodu: free tier için 512px'e resize et
  - Watermark styling: bottom-right, semi-transparent, Arial 16px
  - _Requirements: 3.2, 3.3, 8.1, 8.2, 8.3_

- [x] 8. Registration Flow Service implementasyonu





  - services/registrationService.ts oluştur
  - registerUser metodu: kullanıcı kaydı (mevcut authService'i extend et)
  - selectPlan metodu: plan seçimi kaydet
  - completeFreeRegistration metodu: free tier aktivasyonu (5 görüntü quota set et)
  - completePaidRegistration metodu: ödeme sonrası aktivasyon
  - hasSelectedPlan metodu: plan seçildi mi kontrol
  - canAccessApp metodu: uygulamaya giriş izni kontrolü
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Plan Selection Modal UI komponenti



  - components/PlanSelectionModal.tsx oluştur
  - 4 planı grid layout ile göster (Free, Starter, Pro, Business)
  - Her plan için: isim, fiyat, kota, özellikler listesi
  - "Planı Seç" butonu (free için direkt aktivasyon, paid için ödeme sayfasına yönlendir)
  - Modal kapatılamaz (backdrop click disabled)
  - Responsive design (mobile/desktop)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 10. Payment Checkout Flow UI komponenti





  - components/PaymentCheckout.tsx oluştur
  - İyzico checkout form iframe entegrasyonu
  - Loading state göster (ödeme işlenirken)
  - Success/failure callback handling
  - Error mesajları göster (ödeme başarısız olursa)
  - Retry butonu ekle (hata durumunda)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 11. Dashboard Quota Widget UI komponenti





  - components/QuotaWidget.tsx oluştur
  - Mevcut plan adını göster
  - Kalan kota progress bar (renk: yeşil >50%, sarı 20-50%, kırmızı <20%)
  - Reset/renewal tarihi göster
  - "Şimdi Yükselt" butonu (kota <20% veya expired ise)
  - Credit balance göster (kredi kullanıcıları için)
  - Real-time güncelleme (quota değiştiğinde)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12. Upgrade Modal UI komponenti




  - components/UpgradeModal.tsx oluştur
  - Mevcut plan vs upgrade seçenekleri karşılaştırma tablosu
  - Fiyat ve özellik karşılaştırması
  - "Hemen Yükselt" butonları
  - Prorated fiyat hesaplama göster (mid-cycle upgrade için)
  - Modal trigger'ları: quota exhausted, manual click, 3 days before renewal
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 13. Registration flow entegrasyonu












  - App.tsx'i güncelle: auth state change listener ekle
  - Yeni kullanıcı kaydında PlanSelectionModal göster
  - Plan seçimi yapılmadan main app'e erişimi engelle
  - Free tier seçiminde direkt aktivasyon
  - Paid plan seçiminde PaymentCheckout'a yönlendir
  - Ödeme başarılı olunca main app'e yönlendir
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 14. Image generation flow'a quota kontrolü ekle





  - Mevcut image generation kodunu bul (Gemini API çağrısı)
  - canGenerateImage kontrolü ekle (generation öncesi)
  - Quota yetersizse UpgradeModal göster
  - Generation başarılı olunca decrementQuota çağır
  - Free tier için watermark ve resize uygula
  - Queue'ya ekleme (priority'ye göre)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 8.1, 8.2_

- [x] 15. Dashboard'a QuotaWidget entegrasyonu





  - Dashboard veya header component'e QuotaWidget ekle
  - Persistent görünüm (her sayfada görünsün)
  - Real-time quota updates (generation sonrası)
  - Click to expand (detaylı bilgi için)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 16. Payment callback endpoint ve handling






  - İyzico callback URL için route oluştur
  - Payment verification (token doğrulama)
  - Subscription activation (ödeme başarılıysa)
  - Credit addition (kredi satın alımı için)
  - Error handling ve retry logic
  - User notification (başarı/hata mesajı)
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 17. Subscription renewal ve quota reset automation





  - Supabase Edge Function veya cron job oluştur
  - reset_expired_quotas function'ı günlük çalıştır
  - Expired subscriptions'ı downgrade et (free tier'a)
  - Renewal reminder notifications (3 gün öncesi)
  - Usage logs kaydet
  - _Requirements: 1.5, 11.2, 11.3_

- [x] 18. Admin dashboard ve analytics (optional)





  - Admin panel component'i oluştur
  - Revenue reports (günlük/aylık)
  - Active subscriptions count
  - Conversion rates (free to paid)
  - Top users by usage
  - Payment success/failure rates
  - admin dashboard tasarımı aşağıda ki gibi olacaktır : 
    - <!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Admin Dashboard - AI Mock-up Generator</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#2bcdee",
                        "background-light": "#f6f8f8",
                        "background-dark": "#101f22",
                    },
                    fontFamily: {
                        "display": ["Space Grotesk"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
</head>
<body class="bg-background-light dark:bg-background-dark font-display">
<div class="relative flex min-h-screen w-full">
<!-- SideNavBar -->
<aside class="sticky top-0 h-screen w-64 flex-shrink-0 bg-white/5 dark:bg-black/10 p-4 border-r border-white/10 dark:border-white/10">
<div class="flex h-full flex-col justify-between">
<div class="flex flex-col gap-8">
<div class="flex items-center gap-3">
<div class="flex items-center justify-center size-10 bg-primary/20 rounded-lg">
<span class="material-symbols-outlined text-primary text-2xl">
                                auto_awesome
                            </span>
</div>
<h1 class="text-white text-lg font-bold leading-normal">Mockup AI</h1>
</div>
<div class="flex flex-col gap-2">
<a class="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 text-primary" href="#">
<span class="material-symbols-outlined text-2xl">dashboard</span>
<p class="text-sm font-medium leading-normal">Dashboard</p>
</a>
<a class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5" href="#">
<span class="material-symbols-outlined text-2xl">group</span>
<p class="text-sm font-medium leading-normal">Users</p>
</a>
<a class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5" href="#">
<span class="material-symbols-outlined text-2xl">subscriptions</span>
<p class="text-sm font-medium leading-normal">Subscriptions</p>
</a>
<a class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5" href="#">
<span class="material-symbols-outlined text-2xl">settings</span>
<p class="text-sm font-medium leading-normal">Settings</p>
</a>
</div>
</div>
<div class="flex items-center gap-3 p-2 rounded-lg border border-white/10">
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" data-alt="Admin user avatar" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuAE-r_e60X-ePfsbYuKSLnEtpjTXn-4CBLnI8XNWtg7APocU_Ph0gPOZmoAHYzNqc35AV45_ZIwFhpO0yu5sLg5nDVnL--LQN2ExUHTThJC_YnNctVNl5YRBwAUaBKK_5ya8PI4qCGQ1A_uwzYzOSiUXls7C4jKRuWiKsr8Gz5dI_x-nUIe2yIqoyXOTsLgaQNPweF7cxOUOf-JsPD1J5ecW6VMRfl5ZVQd9PuVrDalg09a0BS3L6nAWAXkNm-EVXcKQmoH8RZjR6U");'></div>
<div class="flex flex-col">
<h1 class="text-white text-base font-medium leading-normal">Admin</h1>
<p class="text-gray-500 text-sm font-normal leading-normal">admin@example.com</p>
</div>
</div>
</div>
</aside>
<!-- Main Content -->
<main class="flex-1 p-6 lg:p-10">
<div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
<!-- PageHeading -->
<div class="flex flex-wrap justify-between gap-4 items-center">
<p class="text-gray-800 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">Admin Dashboard</p>
<button class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em]">
<span class="truncate">Generate Report</span>
</button>
</div>
<!-- Stats -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
<div class="flex flex-1 flex-col gap-2 rounded-lg p-6 border bg-white/5 border-gray-200 dark:border-white/10">
<p class="text-gray-600 dark:text-gray-400 text-base font-medium leading-normal">Total Revenue (Monthly)</p>
<p class="text-gray-800 dark:text-white tracking-light text-2xl font-bold leading-tight">$12,450</p>
<p class="text-green-500 text-base font-medium leading-normal">+5.2%</p>
</div>
<div class="flex flex-1 flex-col gap-2 rounded-lg p-6 border bg-white/5 border-gray-200 dark:border-white/10">
<p class="text-gray-600 dark:text-gray-400 text-base font-medium leading-normal">Active Subscriptions</p>
<p class="text-gray-800 dark:text-white tracking-light text-2xl font-bold leading-tight">1,234</p>
<p class="text-green-500 text-base font-medium leading-normal">+1.8%</p>
</div>
<div class="flex flex-1 flex-col gap-2 rounded-lg p-6 border bg-white/5 border-gray-200 dark:border-white/10">
<p class="text-gray-600 dark:text-gray-400 text-base font-medium leading-normal">New Users (Monthly)</p>
<p class="text-gray-800 dark:text-white tracking-light text-2xl font-bold leading-tight">256</p>
<p class="text-green-500 text-base font-medium leading-normal">+12%</p>
</div>
<div class="flex flex-1 flex-col gap-2 rounded-lg p-6 border bg-white/5 border-gray-200 dark:border-white/10">
<p class="text-gray-600 dark:text-gray-400 text-base font-medium leading-normal">Total Mock-ups Generated</p>
<p class="text-gray-800 dark:text-white tracking-light text-2xl font-bold leading-tight">5,890</p>
<p class="text-green-500 text-base font-medium leading-normal">+8.5%</p>
</div>
</div>
<!-- Charts -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
<div class="lg:col-span-2 flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-gray-200 dark:border-white/10 p-6 bg-white/5">
<p class="text-gray-800 dark:text-white text-base font-medium leading-normal">Revenue Over Time</p>
<p class="text-gray-800 dark:text-white tracking-light text-[32px] font-bold leading-tight truncate">$5,678</p>
<div class="flex gap-1">
<p class="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">Last 30 Days</p>
<p class="text-green-500 text-base font-medium leading-normal">+12.5%</p>
</div>
<div class="flex min-h-[180px] flex-1 flex-col gap-8 py-4">
<svg fill="none" height="148" preserveaspectratio="none" viewbox="-3 0 478 150" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z" fill="url(#paint0_linear)"></path>
<path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#2bcdee" stroke-linecap="round" stroke-width="3"></path>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear" x1="236" x2="236" y1="1" y2="149">
<stop stop-color="#2bcdee" stop-opacity="0.3"></stop>
<stop offset="1" stop-color="#2bcdee" stop-opacity="0"></stop>
</lineargradient>
</defs>
</svg>
</div>
</div>
<div class="flex flex-col gap-4">
<div class="flex min-w-72 flex-1 flex-col justify-between gap-2 rounded-lg border border-gray-200 dark:border-white/10 p-6 bg-white/5">
<p class="text-gray-800 dark:text-white text-base font-medium leading-normal">Conversion Rate (Free to Paid)</p>
<div class="flex justify-center items-center">
<p class="text-gray-800 dark:text-white tracking-light text-5xl font-bold leading-tight truncate">15%</p>
</div>
<div class="flex gap-1 justify-center">
<p class="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">Last 30 Days</p>
<p class="text-red-500 text-base font-medium leading-normal">-1.2%</p>
</div>
</div>
<div class="flex min-w-72 flex-1 flex-col justify-between gap-2 rounded-lg border border-gray-200 dark:border-white/10 p-6 bg-white/5">
<p class="text-gray-800 dark:text-white text-base font-medium leading-normal">Payment Success Rate</p>
<div class="flex justify-center items-center">
<p class="text-gray-800 dark:text-white tracking-light text-5xl font-bold leading-tight truncate">98.2%</p>
</div>
<div class="flex gap-1 justify-center">
<p class="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">Last 30 Days</p>
<p class="text-green-500 text-base font-medium leading-normal">+0.5%</p>
</div>
</div>
</div>
</div>
<!-- SectionHeader -->
<h2 class="text-gray-800 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5">User &amp; Activity</h2>
<!-- Data Tables -->
<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
<!-- Top Users Table -->
<div class="rounded-lg border border-gray-200 dark:border-white/10 bg-white/5 overflow-hidden">
<div class="p-4 border-b border-gray-200 dark:border-white/10">
<h3 class="text-gray-800 dark:text-white text-base font-semibold">Top Users by Usage</h3>
</div>
<div class="overflow-x-auto">
<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-white/5 dark:text-gray-400">
<tr>
<th class="px-6 py-3" scope="col">User</th>
<th class="px-6 py-3" scope="col">Plan</th>
<th class="px-6 py-3 text-right" scope="col">Usage</th>
</tr>
</thead>
<tbody>
<tr class="border-b border-gray-200 dark:border-white/10">
<td class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
<div class="flex items-center gap-3">
<img alt="User avatar" class="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-AT2FD3YesxSI-_s6oEIBuTNFd-A9Q5pEIHdza2rw7cEG1aC5DmWO76BrNLLDMiUZEkRAzceL_2Rz8OqqKpjLkvOEqOhSzqo96-B19FwMjYloAimLIgbfpR6PjEkJDTDsuVYL1Bj4Tg7sKP4gyJ11M4sJ4mGAtk4WtAR20hWf2DkICjoi6TDNH_pMr-c6NylHJO0dCTM9-VBDKNOwd1LGlWcy4B8yhx2hCnBDRnvo8arb6z_rrGuIu8RwvxwrGBaJX5BWxx4Iom4"/>
<span>Alex Johnson</span>
</div>
</td>
<td class="px-6 py-4">Pro</td>
<td class="px-6 py-4 text-right">512</td>
</tr>
<tr class="border-b border-gray-200 dark:border-white/10">
<td class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
<div class="flex items-center gap-3">
<img alt="User avatar" class="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl-0edMM7WKnC05qP8gxaass_EcF5bne4UrabtgnsbV-xJqjVoyAVZsEjj6qa7dvVOU_WTZWSPnLzTqAt9SdWAqkB81lt8K0Iudrs_pmipyaenG9gLemqC-_W27bD9YVuxa9OWohtSbDdlTSPQpU0H2lHBou_QU7dQa44PYFo1ObhfDxsnkl06A5VWAfQy5b195AKBUPt3zCHFoYXBgorLAgNuwPdSrAlnXmWRr_DCy1K2VshCcfTmZRbmk0qXnEFYUNn2fwfR2JU"/>
<span>Ben Carter</span>
</div>
</td>
<td class="px-6 py-4">Pro</td>
<td class="px-6 py-4 text-right">489</td>
</tr>
<tr class="border-b border-gray-200 dark:border-white/10">
<td class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
<div class="flex items-center gap-3">
<img alt="User avatar" class="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBq7OY3GFCwBw0YjY-frpO9SfTNPjQ8GtNTHgFF8nw8RG_1UYm07P7sHERbZwIY96rkX7eFpwtB4VuOpBOQ8kKPjBD4hy8FHB5S_Z-lYBBO-lxpQNKJaWoBJwQB6bj-acXNAaCsV8VAwLdHDkVYNNzfLiiOMdC3oYnzv5LJZ-7HomqK2TEYtRxnwceCLr2hL1yho3gQT5iCBgsj_t8ncLPgpV1Tj9NkrMUdX-2U6Rw2yot1WmU1fDRXQzX2KLLG2nb12GUQudbuMSs"/>
<span>Chloe Davis</span>
</div>
</td>
<td class="px-6 py-4">Team</td>
<td class="px-6 py-4 text-right">450</td>
</tr>
</tbody>
</table>
</div>
</div>
<!-- Recent Payments Table -->
<div class="rounded-lg border border-gray-200 dark:border-white/10 bg-white/5 overflow-hidden">
<div class="p-4 border-b border-gray-200 dark:border-white/10">
<h3 class="text-gray-800 dark:text-white text-base font-semibold">Recent Payment Activity</h3>
</div>
<div class="overflow-x-auto">
<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-white/5 dark:text-gray-400">
<tr>
<th class="px-6 py-3" scope="col">User</th>
<th class="px-6 py-3" scope="col">Amount</th>
<th class="px-6 py-3" scope="col">Status</th>
</tr>
</thead>
<tbody>
<tr class="border-b border-gray-200 dark:border-white/10">
<td class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">dan.evans@example.com</td>
<td class="px-6 py-4">$49.00</td>
<td class="px-6 py-4">
<span class="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
<span class="w-2 h-2 me-1 bg-green-500 rounded-full"></span>
                                                Success
                                            </span>
</td>
</tr>
<tr class="border-b border-gray-200 dark:border-white/10">
<td class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">olivia.f@example.com</td>
<td class="px-6 py-4">$49.00</td>
<td class="px-6 py-4">
<span class="inline-flex items-center bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
<span class="w-2 h-2 me-1 bg-red-500 rounded-full"></span>
                                                Failed
                                            </span>
</td>
</tr>
<tr class="border-b border-gray-200 dark:border-white/10">
<td class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">grace.h@example.com</td>
<td class="px-6 py-4">$19.00</td>
<td class="px-6 py-4">
<span class="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
<span class="w-2 h-2 me-1 bg-green-500 rounded-full"></span>
                                                Success
                                            </span>
</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
</div>
</main>
</div>
</body></html>
  - _Requirements: 7.4, 7.5_

- [x] 19. Error handling ve user feedback





  - Error boundary component'i oluştur
  - Payment error mesajları (Türkçe)
  - Quota error mesajları
  - Network error handling
  - Toast notifications ekle (başarı/hata)
  - Retry mechanisms
  - _Requirements: 5.4, 11.1_


- [x] 21. Localization (i18n) - payment related strings





  - locales/tr.ts'ye payment strings ekle
  - Plan isimleri ve açıklamaları
  - Payment error mesajları
  - Quota warning mesajları
  - Button labels (Yükselt, Satın Al, İptal Et)
  - _Requirements: Tüm UI requirements_

- [x] 22. Testing ve validation



- [x] 22.1 Payment flow test et
  - Sandbox environment'da test ödemeleri yap
  - Subscription activation test et
  - Credit purchase test et
  - Payment failure scenarios test et
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 22.2 Quota management test et
  - Free tier quota limit test et
  - Subscription quota decrement test et
  - Credit deduction test et
  - Quota reset test et
  - _Requirements: 1.4, 2.4, 3.5, 10.2_

- [ ] 22.3 Queue system test et
  - Priority queue test et (free vs paid)
  - Queue position tracking test et
  - Wait time estimation test et
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 22.4 Watermark ve resize test et
  - Free tier watermark application test et
  - Image resize (512px) test et
  - Paid tier (no watermark) test et
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 22.5 Registration flow test et
  - Yeni kullanıcı kaydı test et
  - Plan selection zorunluluğu test et
  - Free tier activation test et
  - Paid plan activation test et
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 23. Documentation ve deployment
  - README'ye payment system dokümantasyonu ekle
  - İyzico setup guide yaz
  - Environment variables dokümante et
  - Deployment checklist oluştur (production için)
  - _Requirements: Tüm requirements_

