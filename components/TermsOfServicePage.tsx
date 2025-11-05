import React from 'react';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with back button */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Geri Dön</span>
          </button>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Hizmet Şartları
          </h1>
          
          <div className="space-y-8 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Hizmet Kullanımı
              </h2>
              <p className="leading-relaxed">
                MockupSuite hizmetlerini kullanarak, bu hizmet şartlarını kabul etmiş olursunuz. Hizmetlerimizi yalnızca yasal amaçlar için ve bu şartlara uygun şekilde kullanmayı kabul edersiniz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Hesap Sorumluluğu
              </h2>
              <p className="leading-relaxed mb-4">
                Hesabınızın güvenliğinden siz sorumlusunuz. Aşağıdaki kurallara uymalısınız:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hesap bilgilerinizi gizli tutun</li>
                <li>Güçlü ve benzersiz bir şifre kullanın</li>
                <li>Hesabınızda gerçekleşen tüm aktivitelerden sorumlusunuz</li>
                <li>Yetkisiz erişim durumunda bizi derhal bilgilendirin</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Fikri Mülkiyet Hakları
              </h2>
              <p className="leading-relaxed mb-4">
                MockupSuite kullanarak oluşturduğunuz içeriğin tüm hakları size aittir. Ancak:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Yüklediğiniz içeriğin haklarına sahip olduğunuzu garanti edersiniz</li>
                <li>Telif hakkı ihlali yapan içerik yüklememeyi kabul edersiniz</li>
                <li>Oluşturulan mockup'ları ticari amaçlarla kullanabilirsiniz</li>
                <li>MockupSuite platformu ve teknolojisi üzerindeki haklar bize aittir</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Abonelik ve Ödemeler
              </h2>
              <p className="leading-relaxed mb-4">
                Ücretli planlar için:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ödemeler aylık olarak otomatik yenilenir</li>
                <li>İstediğiniz zaman aboneliğinizi iptal edebilirsiniz</li>
                <li>İptal sonrası mevcut dönem sonuna kadar erişiminiz devam eder</li>
                <li>Fiyatlar önceden bildirimle değiştirilebilir</li>
                <li>İade politikamız için destek ekibimizle iletişime geçin</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Kullanım Kısıtlamaları
              </h2>
              <p className="leading-relaxed mb-4">
                Aşağıdaki faaliyetler yasaktır:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hizmeti kötüye kullanmak veya sistemi manipüle etmeye çalışmak</li>
                <li>Yasadışı, zararlı veya saldırgan içerik oluşturmak</li>
                <li>Başkalarının hesaplarına yetkisiz erişim sağlamaya çalışmak</li>
                <li>Hizmeti tersine mühendislik yapmak veya kopyalamak</li>
                <li>Spam veya otomatik toplu işlemler yapmak</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Hizmet Değişiklikleri ve Sonlandırma
              </h2>
              <p className="leading-relaxed">
                MockupSuite, hizmetleri herhangi bir zamanda değiştirme, askıya alma veya sonlandırma hakkını saklı tutar. Önemli değişiklikler için önceden bildirimde bulunmaya çalışacağız.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Sorumluluk Reddi
              </h2>
              <p className="leading-relaxed">
                MockupSuite hizmetleri "olduğu gibi" sunulmaktadır. Hizmetin kesintisiz veya hatasız olacağını garanti etmiyoruz. Hizmet kullanımından kaynaklanan dolaylı zararlardan sorumlu değiliz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Uyuşmazlık Çözümü
              </h2>
              <p className="leading-relaxed">
                Bu şartlardan kaynaklanan uyuşmazlıklar Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklar öncelikle dostane görüşmelerle çözülmeye çalışılacaktır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. İletişim
              </h2>
              <p className="leading-relaxed">
                Hizmet şartları hakkında sorularınız için: <a href="mailto:support@mockupsuite.com" className="text-primary hover:underline">support@mockupsuite.com</a>
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Son Güncelleme: 2 Kasım 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
