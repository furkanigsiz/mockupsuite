import React from 'react';

export const PrivacyPolicyPage: React.FC = () => {
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
            Gizlilik Politikası
          </h1>
          
          <div className="space-y-8 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Giriş
              </h2>
              <p className="leading-relaxed">
                MockupSuite olarak gizliliğinize saygı duyuyoruz ve kişisel verilerinizi korumaya kararlıyız. Bu gizlilik politikası, bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Topladığımız Veriler
              </h2>
              <p className="leading-relaxed mb-4">
                Hizmetlerimizi sağlamak için aşağıdaki bilgileri topluyoruz:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hesap bilgileri (e-posta, ad, soyad)</li>
                <li>Yüklediğiniz ürün fotoğrafları ve tasarım dosyaları</li>
                <li>Oluşturulan mockup'lar ve videolar</li>
                <li>Kullanım verileri ve tercihler</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Verilerinizi Nasıl Kullanıyoruz
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hizmetlerimizi sağlamak ve mockup'lar oluşturmak için</li>
                <li>Hizmetlerimizi geliştirmek ve optimize etmek için</li>
                <li>Müşteri desteği sağlamak için</li>
                <li>Önemli güncellemeler ve bildirimler göndermek için</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Veri Güvenliği
              </h2>
              <p className="leading-relaxed">
                Verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz. Tüm veriler şifrelenir ve güvenli sunucularda saklanır. Supabase altyapısını kullanarak verilerinizin güvenliğini sağlıyoruz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Üçüncü Taraf Hizmetler
              </h2>
              <p className="leading-relaxed mb-4">
                Hizmetlerimizi sağlamak için aşağıdaki üçüncü taraf hizmetleri kullanıyoruz:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Supabase - Veri depolama ve kimlik doğrulama</li>
                <li>Google Gemini AI - Görsel ve video oluşturma</li>
                <li>İyzico - Güvenli ödeme işlemleri</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Haklarınız
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Kişisel verilerinize erişim hakkı</li>
                <li>Verilerinizi düzeltme hakkı</li>
                <li>Verilerinizi silme hakkı</li>
                <li>Verilerinizi dışa aktarma hakkı</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Çerezler
              </h2>
              <p className="leading-relaxed">
                Web sitemiz, deneyiminizi iyileştirmek ve hizmetlerimizi sağlamak için çerezler kullanır. Çerezleri tarayıcı ayarlarınızdan yönetebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Politika Değişiklikleri
              </h2>
              <p className="leading-relaxed">
                Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda sizi bilgilendireceğiz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                İletişim
              </h2>
              <p className="leading-relaxed">
                Gizlilik politikamız hakkında sorularınız varsa, lütfen <a href="mailto:support@mockupsuite.com" className="text-primary hover:underline">support@mockupsuite.com</a> adresinden bizimle iletişime geçin.
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
