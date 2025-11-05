import React, { useState } from 'react';

interface Example {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
}

const examples: Example[] = [
  {
    id: '1',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXS63InjOi1JB2p7bK_P_M_qwROP4XqEBBlgs518VMKjTzrs5XN2ZdewVFAlRzibT-7v4U2ptsfVLKHzuBB-Dn7HNP_v9uBUyIIXxWCh6RQULOIvb7JqXL7jvwwkt5jhgT1--ToV_bjkIUXgyYVGw57FW-vk0JbOaQFp_zE1653sWsepmyZlyyUfCv8u85opg0X1R42f7KG9dt4EVNKGGTG0InCDDdIprnVNqat2zMimlDGTaDy0X0sOWpfCaRZusc5UuJmSAiQJU',
    title: 'T-shirt on a model in a vibrant city street',
    category: 'Apparel'
  },
  {
    id: '2',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGKD1j57J6gfYtpuaxfHmxlIsX8eX42pv9va3H7Y6NP-EpvEQr4rj_QtJW_kff8gAKdQZXH9C4FirPEJt3AXvEL41E2rNc_RmeIhNaBi2cN8BrE2d27USGn92z1EQ0iKxnwHx99cQM8ZYou41vzXrMRP41GhX8EhUMs11Vygg_-GzKEhyOIN3_3vCtICunpo_uFuDwt7QGeRC4Yj5yqo8KMopY7Jq-nIt5hWnGnXI3-nP5HlCzGd0BtmubawQvTPFa2nKvdDZxBZc',
    title: 'Skincare bottle in a minimalist bathroom',
    category: 'Cosmetics'
  },
  {
    id: '3',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwvON7d3NQIBHCIeOG1jv9yKBw6Io3GgRpYMMt9oKM8t5cLZYShZEJrYydd6KKnKQ4iiACwQZDFWEs_vBy6GmqgB8laQ3219GIJ0AhucXDTvsXo-rclM9uT6IEVKtEMp0dAdZdGXy-34HtADf1gMYMNF-enusSeMfNaHbNlt9wgym_lsgUKEVHbx8awwTsEPB9leA3JVZfcp4EIcKE-_faRsJaH-xyhiLMiwGDQKR5590zsD2q-HERMHzD-1sHJm6EhU4SN0I28E4',
    title: 'Coffee bag on a rustic cafe table',
    category: 'Packaging'
  },
  {
    id: '4',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_WaqQ0n5v2QzkGE86vFiVI7xJiqR-ZetUk8Yc_g2Fw4CO3G5ZNLP764vP99Mk6VIsEc054hwLduDxvcipwo251NEOtl5DulPWwBnCYI3pve0CLgC-nxKIxN4eSDVwvMCujVh-o6BX-pmmpcI_YLRF0RA47v_rTZBLk87YVtcRs1wUqhsfHp8fLE0omHhFcUXW4d19NnyWXUANQ6m5Ta4NNb9I-x6oQO7RVC0sn5jkNCRK7gP2YPjlk5sqZBIULp8INiOufEcdlSo',
    title: 'App screen on a phone held by a person',
    category: 'Apparel'
  },
  {
    id: '5',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBylFshYqaYrsueq2kP2Tr6-mynCNYJEPLshR-_2jyFzPTGoIgd86x5aIDwXA6oO7WGbxASl6FfhM6yVvvvEis-dc9f_jBsW1vWAYMTo9QMbf4I18GdfAQH9_kiMteXYe6dQC9c1ORr_RmFFW7rISr8Zj8glb-SW-NtoJIxx340bMvedwi08gusxAdu6ndwtAcfAMN_77nGxjE4A513tjyVH-cE4zufFSQgwui3nVWUGSjGUlyQAvwSqcE5dBSl0TsC09oXvJoziFM',
    title: 'Luxury perfume bottle with dramatic lighting',
    category: 'Cosmetics'
  },
  {
    id: '6',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNYI4CjshY0fg7V-B-v3Z9tWzWkSSkKfWq1LFsuGsZWNdTSnNyq5KUGJbHelFhrQJVFJEgg0Ys96-1p29wxwEkg2O1yPlJBr-BBm_jRThIB439Q7tc8gCi-6jBIvf7H_o5-fLqt1YrlJyMA5OC-nc3jxBqmVq8u5JlrcjMzn36EjWrvutbXtcgyU7doa2fR5qR2vcr15sxWCYyHDlN103vKAiuyzm0vO9CnzvFY0e9UNiBVLE2Ps1S9x82nLAGsCfl7lSsboMS80w',
    title: 'Scented candle in a cozy living room',
    category: 'Home Goods'
  },
  {
    id: '7',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9R_BvdyWHxFqL-M3aJj45KnFnS_CE6gsHnfiLrYkwYX0e7Fvst1r2srL2h28jdhN4V42cUfDMpVXjwjRyzP241_Mr5_d_QNPJVsnD6Dcv7oQD7x5fjdTDVrxNCRWKuRx32rgngbBUXE2I45PVRSLnOzRr7Aii33-oPWmdFvvJ0Evf4Q3IIhFjlglsISqN1JrfEh7BR09Fcr1-L_HjvU1EVzA-v6O7tmnu0Vkqv_N8zlZwRXKYDPgxtZeReIQHEc0Dr-nxHIoVXiM',
    title: 'Branded tote bag at an outdoor market',
    category: 'Apparel'
  },
  {
    id: '8',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9uZdE-cF5lfIBrF_0KRm12gbCxHFrvUcQhSciOH5AgZvcxDFgvY_exU_eLTyXhDfiuEkJkMuRWCOdT_P_cxglRy2Rr8QqphvVx4uxOiiio-jz_467uKGWQ3lLahuabUwLWSMVYBYAtVNjOnypuZt59Ap2UlWnZjNM4UTRnghNCrLrGCE0XaW__z_0KA3QPtBgLVIBo1hY1cd6r-r3imgxo5Voy8aPNJ-kScexsmK8NEPF3lTFrDYxZ6CFB4qsUyL1dJ_mmSpAuHU',
    title: 'Hardcover book on a stylish desk',
    category: 'Packaging'
  }
];

const categories = ['Tümü', 'Giyim', 'Kozmetik', 'Ev Eşyaları', 'Ambalaj'];

const categoryMap: Record<string, string> = {
  'Tümü': 'All',
  'Giyim': 'Apparel',
  'Kozmetik': 'Cosmetics',
  'Ev Eşyaları': 'Home Goods',
  'Ambalaj': 'Packaging'
};

interface ExamplesPageProps {
  onBack?: () => void;
  onSignIn?: () => void;
}

export default function ExamplesPage({ onBack, onSignIn }: ExamplesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedImage, setSelectedImage] = useState<Example | null>(null);

  const filteredExamples = selectedCategory === 'Tümü' 
    ? examples 
    : examples.filter(ex => ex.category === categoryMap[selectedCategory]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-b-[#283639] px-4 sm:px-10 py-3">
        <div className="flex items-center gap-4 text-gray-800 dark:text-white">
          <div className="size-6">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="10" width="40" height="40" fill="#6366F1" rx="4"/>
              <rect x="40" y="30" width="40" height="60" fill="#6366F1" rx="4"/>
            </svg>
          </div>
          <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">MockupSuite</h2>
        </div>
        
        <div className="hidden md:flex flex-1 justify-end gap-8">
          <div className="flex items-center gap-9">
            <button 
              onClick={onBack}
              className="text-gray-600 dark:text-white text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer"
            >
              Ana Sayfa
            </button>
            <span className="text-primary text-sm font-bold leading-normal">Örnekler</span>
          </div>
          <button 
            onClick={onSignIn}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-gray-900 dark:text-[#111718] text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity"
          >
            <span className="truncate">Başlayın</span>
          </button>
        </div>
        
        <div className="md:hidden">
          <button 
            onClick={onBack}
            className="text-gray-600 dark:text-white hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col gap-12 md:gap-16 lg:gap-20 py-10 md:py-16 px-4 md:px-10 lg:px-20 xl:px-40 max-w-[1200px] mx-auto">
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex flex-col gap-6 text-center md:text-left md:w-1/2">
            <div className="flex flex-col gap-2">
              <h1 className="text-black dark:text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
                Basit Fotoğraflardan Muhteşem Vitrinlere
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base font-normal leading-normal">
                AI'mızın neler yapabileceğini görün. Saniyeler içinde oluşturulan profesyonel ürün mockup'larını keşfedin.
              </p>
            </div>
            <button className="flex w-full md:w-auto md:self-start cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 md:h-12 px-4 md:px-5 bg-primary text-background-dark text-sm md:text-base font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">İlk Mockup'ınızı Oluşturun</span>
            </button>
          </div>
          <div 
            className="w-full md:w-1/2 bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuABXAp_qYD4cb5678L_AI71gUO8F5GtSVaYhjeIkzLToXDsSUh1AaEg5zsBIHHFURXq6zTVecj4hJSMjT_6driH4p2yyGKNtWbK62Eejo8D4cyikXWFklIkXE-GScxiaf6fG71Maeevjq9Lq-rpYS7QGKaYbXi2f5Mxx8vuDsVNADJSOZNzTyQ8PiHfaO9anzEuzpYWPle7p5Th6RjEF_yjYXPKim7iDSVL-h50Od5waBefsl8M165yAq5y4sqor6Hq89IVGZjjtPc")' }}
          />
        </section>

        {/* Category Filter */}
        <section className="flex flex-col gap-4">
          <h2 className="text-black dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
            Kategoriye Göre Keşfet
          </h2>
          <div className="flex gap-2 sm:gap-3 p-1 flex-wrap">
            {categories.map(category => (
              <div
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex h-8 cursor-pointer shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary/20 text-primary'
                    : 'bg-gray-500/10 dark:bg-white/10 hover:bg-gray-500/20 dark:hover:bg-white/20'
                }`}
              >
                <p className={`text-sm ${selectedCategory === category ? 'font-bold' : 'font-medium'} leading-normal ${
                  selectedCategory === category ? '' : 'text-black dark:text-white'
                }`}>
                  {category}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Examples Grid */}
        <section>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {filteredExamples.map(example => (
              <div
                key={example.id}
                className="group relative bg-cover bg-center flex flex-col gap-3 rounded-lg justify-end aspect-[3/4] overflow-hidden cursor-pointer"
                style={{ backgroundImage: `url("${example.imageUrl}")` }}
                onClick={() => setSelectedImage(example)}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="relative p-4">
                  <p className="text-white text-base font-bold leading-tight line-clamp-3">
                    {example.title}
                  </p>
                </div>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="bg-white/20 backdrop-blur-sm text-white rounded-full p-3">
                    <span className="material-symbols-outlined">zoom_in</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-500/10 dark:bg-white/5 rounded-xl p-8 md:p-12 text-center flex flex-col items-center gap-6">
          <h2 className="text-black dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em] max-w-md">
            Kendi Muhteşem Mockup'larınızı Oluşturmaya Hazır mısınız?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-lg">
            Ürün fotoğraflarınızı sadece birkaç tıklamayla profesyonel, yüksek dönüşüm sağlayan görsellere dönüştürün. Başlamak için kredi kartı gerekmez.
          </p>
          <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-background-dark text-base font-bold leading-normal tracking-[0.015em]">
            <span className="truncate">Mockup'ınızı Oluşturun</span>
          </button>
        </section>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage.imageUrl} 
              alt={selectedImage.title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button 
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/30 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <p className="text-white text-lg font-bold">{selectedImage.title}</p>
              <p className="text-gray-300 text-sm">{selectedImage.category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
