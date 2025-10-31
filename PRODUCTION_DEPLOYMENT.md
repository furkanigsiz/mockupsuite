# Production Deployment Checklist - İyzico Ödeme Sistemi

Bu döküman, uygulamanızı production'a deploy ederken İyzico ödeme sistemi için yapmanız gereken değişiklikleri içerir.

## 🔴 KRİTİK: Production'a Geçiş Adımları

### 1. İyzico API Anahtarlarını Değiştir

**Sandbox (Test) → Production (Canlı) Geçiş**

Supabase Dashboard → Project Settings → Edge Functions → Secrets bölümünden:

```bash
# ❌ KALDIR (Sandbox/Test)
IYZICO_API_KEY=sandbox-xxx
IYZICO_SECRET_KEY=sandbox-xxx
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# ✅ EKLE (Production/Canlı)
IYZICO_API_KEY=<canlı-api-key>
IYZICO_SECRET_KEY=<canlı-secret-key>
IYZICO_BASE_URL=https://api.iyzipay.com
```

**Canlı API anahtarlarını nereden alacaksın:**
1. İyzico Merchant Panel'e giriş yap: https://merchant.iyzipay.com
2. Ayarlar → API Anahtarları bölümüne git
3. Production API Key ve Secret Key'i kopyala

---

### 2. Callback URL'i Güncelle

**Development (ngrok) → Production (domain) Geçiş**

Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```bash
# ❌ KALDIR (Development)
IYZICO_CALLBACK_URL=https://7221330bff55.ngrok-free.app/payment-callback.html

# ✅ EKLE (Production)
IYZICO_CALLBACK_URL=https://yourdomain.com/payment-callback.html
```

**Önemli:** 
- HTTPS zorunlu! HTTP ile çalışmaz.
- Domain'in sonuna `/payment-callback.html` eklemeyi unutma.

---

### 3. Test Kartlarını Kaldır (Opsiyonel)

Eğer kodda test kartı bilgileri hardcode edilmişse, bunları kaldır. Şu anda kodda yok ama kontrol et:

```typescript
// ❌ KALDIR - Production'da test kartı olmamalı
identityNumber: '11111111111'  // Bu test için, production'da gerçek TC olmalı
```

**Not:** Şu anda `supabase/functions/iyzico-payment/index.ts` dosyasında test TC numarası var:
```typescript
identityNumber: '11111111111', // Test için
```

Production'da bu değer kullanıcıdan alınmalı veya gerçek bir değer olmalı.

---

### 4. CORS Ayarlarını Güncelle (Opsiyonel ama Önerilen)

`supabase/functions/iyzico-payment/index.ts` dosyasında:

```typescript
// ❌ Development (Tüm originlere izin)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ Production (Sadece kendi domain'ine izin)
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

### 5. Console.log'ları Temizle (Opsiyonel)

Production'da gereksiz log'ları kaldırabilirsin:

**Dosyalar:**
- `public/payment-callback.html` - Tüm `console.log` satırları
- `components/PaymentCheckout.tsx` - Debug log'ları
- `supabase/functions/iyzico-payment/index.ts` - Console.log'lar

**Veya:** Log'ları bırak, production'da sorun çıkarsa debug etmek için işe yarar.

---

### 6. İyzico Merchant Panel Ayarları

İyzico Merchant Panel'de yapman gerekenler:

1. **Callback URL'i Kaydet:**
   - Ayarlar → Teknik Ayarlar → Callback URL
   - `https://yourdomain.com/payment-callback.html` ekle

2. **IP Whitelist (Opsiyonel):**
   - Güvenlik için Supabase Edge Function IP'lerini whitelist'e ekleyebilirsin
   - Supabase IP'leri: https://supabase.com/docs/guides/platform/going-into-prod#ip-addresses

3. **Test Modunu Kapat:**
   - Ayarlar → Genel Ayarlar
   - "Test Modu" kapalı olmalı

---

## 📋 Deployment Checklist

Deployment öncesi kontrol listesi:

- [ ] İyzico Production API anahtarları Supabase'e eklendi
- [ ] `IYZICO_BASE_URL` production URL'e güncellendi
- [ ] `IYZICO_CALLBACK_URL` production domain'e güncellendi
- [ ] Edge function yeniden deploy edildi: `supabase functions deploy iyzico-payment`
- [ ] İyzico Merchant Panel'de callback URL kaydedildi
- [ ] İyzico Test Modu kapatıldı
- [ ] HTTPS sertifikası aktif (Let's Encrypt, Cloudflare, vb.)
- [ ] Gerçek kart ile test ödeme yapıldı
- [ ] Ödeme doğrulama çalışıyor
- [ ] Ödeme geçmişi görüntüleniyor

---

## 🧪 Production Test

Production'a geçtikten sonra mutlaka test et:

1. **Küçük Tutarlı Test Ödeme:**
   - 1 TL gibi küçük bir tutar ile test yap
   - Gerçek kart kullan (test kartları çalışmaz)
   - Ödeme tamamlanıyor mu kontrol et

2. **Callback Kontrolü:**
   - Ödeme sonrası callback sayfası açılıyor mu?
   - Token doğru alınıyor mu?
   - Ödeme durumu database'e kaydediliyor mu?

3. **Hata Senaryoları:**
   - Yetersiz bakiye
   - Yanlış kart bilgisi
   - Ödeme iptali
   - Hata mesajları doğru gösteriliyor mu?

---

## 🔒 Güvenlik Notları

### Önemli Güvenlik Kontrolleri:

1. **API Anahtarları:**
   - ✅ Supabase Secrets'ta saklanıyor (güvenli)
   - ❌ Asla frontend kodunda olmamalı
   - ❌ Git'e commit edilmemeli

2. **Callback URL:**
   - ✅ HTTPS zorunlu
   - ✅ Sadece kendi domain'in
   - ❌ HTTP kullanma

3. **CORS:**
   - Production'da `Access-Control-Allow-Origin: *` yerine kendi domain'ini kullan

4. **User Authentication:**
   - ✅ Her ödeme isteği user token ile doğrulanıyor
   - ✅ User ID kontrolü yapılıyor

---

## 🚨 Sorun Giderme

### Ödeme Tamamlanıyor Ama Callback Gelmiyor

**Çözüm:**
1. İyzico Merchant Panel'de callback URL'i kontrol et
2. Supabase Secrets'ta `IYZICO_CALLBACK_URL` doğru mu kontrol et
3. Edge function loglarına bak: Supabase Dashboard → Edge Functions → Logs

### "Invalid API Key" Hatası

**Çözüm:**
1. Production API anahtarlarını doğru kopyaladın mı kontrol et
2. `IYZICO_BASE_URL` production URL'e güncellendi mi kontrol et
3. Edge function'ı yeniden deploy et

### CORS Hatası

**Çözüm:**
1. `corsHeaders` içinde domain'in doğru yazıldığından emin ol
2. HTTPS kullandığından emin ol
3. Edge function'ı yeniden deploy et

---

## 📞 Destek

- **İyzico Destek:** https://dev.iyzipay.com/tr/destek
- **İyzico Dökümanlar:** https://dev.iyzipay.com/tr/api
- **Supabase Dökümanlar:** https://supabase.com/docs

---

## ✅ Son Kontrol

Production'a geçmeden önce:

```bash
# 1. Edge function'ı deploy et
supabase functions deploy iyzico-payment

# 2. Secrets'ları kontrol et
supabase secrets list

# 3. Test ödeme yap
# Gerçek kart ile 1 TL test ödemesi yap
```

**Başarılar! 🚀**
