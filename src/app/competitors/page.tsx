'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { FaGooglePlay, FaApple, FaPlus, FaTrash, FaFileExcel } from 'react-icons/fa';
import { Card, BarChart } from "@tremor/react";
import * as XLSX from 'xlsx';

type Platform = 'google' | 'apple';

interface AppAnalysis {
  appName: string;
  statistics: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
  };
  categories: {
    [key: string]: number;
  };
  ratings: {
    [key: string]: number;
  };
  sentimentTrend: {
    date: string;
    text: string;
    sentiment: string;
  }[];
  insights: string;
}

export default function CompetitorsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('google');
  const [mainAppUrl, setMainAppUrl] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleAnalyses, setGoogleAnalyses] = useState<AppAnalysis[]>([]);
  const [appleAnalyses, setAppleAnalyses] = useState<AppAnalysis[]>([]);

  const analyses = selectedPlatform === 'google' ? googleAnalyses : appleAnalyses;

  const handlePlatformChange = (platform: Platform) => {
    setSelectedPlatform(platform);
    setMainAppUrl('');
    setCompetitorUrls(['', '', '']);
    setError(null);
  };

  const handleCompetitorUrlChange = (index: number, value: string) => {
    const newUrls = [...competitorUrls];
    newUrls[index] = value;
    setCompetitorUrls(newUrls);
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allUrls = [mainAppUrl, ...competitorUrls];
      
      if (allUrls.some(url => !url)) {
        throw new Error('Lütfen tüm uygulama linklerini girin');
      }

      const response = await fetch('/api/competitor-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          mainAppUrl,
          competitorUrls
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analiz yapılırken bir hata oluştu');
      }

      if (selectedPlatform === 'google') {
        setGoogleAnalyses(data.analyses);
      } else {
        setAppleAnalyses(data.analyses);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadExcel = () => {
    if (!analyses.length) return;

    // Excel için veriyi hazırla
    const workbook = XLSX.utils.book_new();

    // Tüm Yorumlar Sayfası
    const allReviewsData = analyses.flatMap(analysis => {
      // API'den gelen yorumları al (sentimentTrend içinde)
      return analysis.sentimentTrend.map(review => {
        const mainCategory = getMainCategory(review.text);
        const subCategory = getSubCategory(mainCategory, review.text);
        return {
          'Uygulama Adı': analysis.appName,
          'Yorum Metni': review.text,
          'Duygu Analizi': review.sentiment === 'positive' ? 'Olumlu' : 
                          review.sentiment === 'negative' ? 'Olumsuz' : 'Nötr',
          'Ana Kategori': mainCategory,
          'Alt Kategori': subCategory,
          'Anahtar Kelimeler': getKeywords(review.text).join(', '),
          'Tarih': new Date(review.date).toLocaleDateString('tr-TR'),
        };
      });
    });

    const allReviewsSheet = XLSX.utils.json_to_sheet(allReviewsData);
    XLSX.utils.book_append_sheet(workbook, allReviewsSheet, "Tüm Yorumlar");

    // Sütun genişliklerini ayarla
    const columnWidths = [
      { wch: 20 },  // Uygulama Adı
      { wch: 100 }, // Yorum Metni
      { wch: 15 },  // Duygu Analizi
      { wch: 20 },  // Ana Kategori
      { wch: 20 },  // Alt Kategori
      { wch: 40 },  // Anahtar Kelimeler
      { wch: 15 },  // Tarih
    ];
    allReviewsSheet['!cols'] = columnWidths;

    // Duygu Analizi Sayfası
    const sentimentData = analyses.map(analysis => ({
      'Uygulama Adı': analysis.appName,
      'Toplam Yorum': analysis.statistics.total,
      'Olumlu Yorum (%)': ((analysis.statistics.positive / analysis.statistics.total) * 100).toFixed(2),
      'Nötr Yorum (%)': ((analysis.statistics.neutral / analysis.statistics.total) * 100).toFixed(2),
      'Olumsuz Yorum (%)': ((analysis.statistics.negative / analysis.statistics.total) * 100).toFixed(2),
      'Olumlu Yorum Sayısı': analysis.statistics.positive,
      'Nötr Yorum Sayısı': analysis.statistics.neutral,
      'Olumsuz Yorum Sayısı': analysis.statistics.negative
    }));
    const sentimentSheet = XLSX.utils.json_to_sheet(sentimentData);
    XLSX.utils.book_append_sheet(workbook, sentimentSheet, "Duygu Analizi");

    // Kategori Dağılımı Sayfası
    const allCategories = Array.from(
      new Set(analyses.flatMap(a => Object.keys(a.categories)))
    );
    const categoryData = analyses.map(analysis => {
      const total = Object.values(analysis.categories).reduce((a, b) => a + b, 0);
      return {
        'Uygulama Adı': analysis.appName,
        ...Object.fromEntries(
          allCategories.map(cat => [
            `${cat} (%)`,
            ((analysis.categories[cat] || 0) / total * 100).toFixed(2)
          ])
        ),
        ...Object.fromEntries(
          allCategories.map(cat => [
            `${cat} (Sayı)`,
            analysis.categories[cat] || 0
          ])
        )
      };
    });
    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categorySheet, "Kategori Dağılımı");

    // Puan Dağılımı Sayfası
    const ratingData = analyses.map(analysis => {
      const total = Object.values(analysis.ratings).reduce((a, b) => a + b, 0);
      return {
        'Uygulama Adı': analysis.appName,
        '5 Yıldız (%)': ((analysis.ratings['5'] || 0) / total * 100).toFixed(2),
        '4 Yıldız (%)': ((analysis.ratings['4'] || 0) / total * 100).toFixed(2),
        '3 Yıldız (%)': ((analysis.ratings['3'] || 0) / total * 100).toFixed(2),
        '2 Yıldız (%)': ((analysis.ratings['2'] || 0) / total * 100).toFixed(2),
        '1 Yıldız (%)': ((analysis.ratings['1'] || 0) / total * 100).toFixed(2),
        '5 Yıldız (Sayı)': analysis.ratings['5'] || 0,
        '4 Yıldız (Sayı)': analysis.ratings['4'] || 0,
        '3 Yıldız (Sayı)': analysis.ratings['3'] || 0,
        '2 Yıldız (Sayı)': analysis.ratings['2'] || 0,
        '1 Yıldız (Sayı)': analysis.ratings['1'] || 0,
      };
    });
    const ratingSheet = XLSX.utils.json_to_sheet(ratingData);
    XLSX.utils.book_append_sheet(workbook, ratingSheet, "Puan Dağılımı");

    // Excel dosyasını indir
    XLSX.writeFile(workbook, 'Rakip_Analizi_Raporu.xlsx');
  };

  // Yardımcı fonksiyonlar
  const getMainCategory = (text: string): string => {
    const categories = {
      'Performans': ['yavaş', 'donma', 'kasma', 'hızlı', 'akıcı', 'performans', 'çökme', 'bug', 'hata'],
      'Kullanılabilirlik': ['kullanımı', 'arayüz', 'tasarım', 'menü', 'düzen', 'karmaşık', 'basit', 'kolay'],
      'Özellikler': ['özellik', 'fonksiyon', 'seçenek', 'güncelleme', 'yenilik'],
      'Güvenlik': ['güvenlik', 'gizlilik', 'şifre', 'hesap', 'doğrulama'],
      'Teknik Sorunlar': ['bağlantı', 'internet', 'sunucu', 'hata', 'çöküyor', 'açılmıyor'],
      'Müşteri Hizmetleri': ['destek', 'yardım', 'iletişim', 'çözüm', 'yanıt'],
      'Fiyatlandırma': ['ücret', 'fiyat', 'pahalı', 'ucuz', 'ödeme', 'satın alma'],
      'İçerik': ['içerik', 'reklam', 'bilgi', 'veri', 'paylaşım']
    };

    const lowercaseText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowercaseText.includes(keyword))) {
        return category;
      }
    }
    return 'Diğer';
  };

  const getSubCategory = (mainCategory: string, text: string): string => {
    const subCategories = {
      'Performans': {
        'Uygulama Hızı': ['yavaş', 'hızlı', 'akıcı', 'performans'],
        'Stabilite': ['donma', 'kasma', 'çökme', 'bug'],
        'Sistem Gereksinimleri': ['ram', 'bellek', 'pil', 'batarya']
      },
      'Kullanılabilirlik': {
        'Arayüz Tasarımı': ['arayüz', 'tasarım', 'düzen', 'görünüm'],
        'Kullanım Kolaylığı': ['kullanımı', 'kolay', 'basit', 'karmaşık'],
        'Erişilebilirlik': ['erişim', 'ulaşım', 'bulma', 'navigasyon']
      },
      'Özellikler': {
        'Mevcut Özellikler': ['özellik', 'fonksiyon', 'seçenek'],
        'Güncellemeler': ['güncelleme', 'yenilik', 'versiyon'],
        'Özellik İstekleri': ['eksik', 'olsa', 'eklense']
      },
      'Güvenlik': {
        'Hesap Güvenliği': ['şifre', 'hesap', 'doğrulama'],
        'Veri Gizliliği': ['gizlilik', 'veri', 'bilgi'],
        'Güvenlik Sorunları': ['güvenlik', 'risk', 'tehlike']
      },
      'Teknik Sorunlar': {
        'Bağlantı Sorunları': ['bağlantı', 'internet', 'sunucu'],
        'Uygulama Hataları': ['hata', 'çöküyor', 'açılmıyor'],
        'Cihaz Uyumluluğu': ['uyumluluk', 'sürüm', 'cihaz']
      },
      'Müşteri Hizmetleri': {
        'Destek Kalitesi': ['destek', 'yardım', 'çözüm'],
        'Yanıt Süresi': ['yanıt', 'bekleme', 'süre'],
        'İletişim': ['iletişim', 'ulaşma', 'kontak']
      },
      'Fiyatlandırma': {
        'Ücretlendirme': ['ücret', 'fiyat', 'pahalı', 'ucuz'],
        'Ödeme Sorunları': ['ödeme', 'satın alma', 'işlem'],
        'Fiyat/Fayda': ['değer', 'karşılık', 'fayda']
      },
      'İçerik': {
        'İçerik Kalitesi': ['içerik', 'kalite', 'bilgi'],
        'Reklamlar': ['reklam', 'sponsor', 'promosyon'],
        'Güncellik': ['güncel', 'yeni', 'eski']
      }
    };

    const lowercaseText = text.toLowerCase();
    const categorySubCategories = subCategories[mainCategory as keyof typeof subCategories];
    
    if (categorySubCategories) {
      for (const [subCategory, keywords] of Object.entries(categorySubCategories)) {
        if (keywords.some(keyword => lowercaseText.includes(keyword))) {
          return subCategory;
        }
      }
    }
    return 'Diğer';
  };

  const getKeywords = (text: string): string[] => {
    const keywords = [
      'yavaş', 'hızlı', 'donma', 'kasma', 'çökme', 'bug', 'hata', 'performans',
      'kullanım', 'arayüz', 'tasarım', 'menü', 'kolay', 'zor', 'karmaşık',
      'özellik', 'güncelleme', 'yenilik', 'fonksiyon',
      'güvenlik', 'gizlilik', 'şifre', 'hesap',
      'bağlantı', 'internet', 'sunucu', 'çöküyor',
      'destek', 'yardım', 'iletişim', 'çözüm',
      'ücret', 'fiyat', 'pahalı', 'ucuz', 'ödeme',
      'içerik', 'reklam', 'bilgi', 'veri'
    ];

    const lowercaseText = text.toLowerCase();
    return keywords.filter(keyword => lowercaseText.includes(keyword));
  };

  const renderSentimentComparison = () => {
    if (!analyses.length) return null;

    const data = analyses.map(analysis => ({
      name: analysis.appName,
      'Olumlu': (analysis.statistics.positive / analysis.statistics.total) * 100,
      'Nötr': (analysis.statistics.neutral / analysis.statistics.total) * 100,
      'Olumsuz': (analysis.statistics.negative / analysis.statistics.total) * 100,
    }));

    return (
      <Card className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Duygu Analizi Karşılaştırması</h3>
        <BarChart
          className="mt-4 h-80"
          data={data}
          index="name"
          categories={['Olumlu', 'Nötr', 'Olumsuz']}
          colors={['emerald', 'blue', 'red']}
          valueFormatter={(value) => `${value.toFixed(1)}%`}
          yAxisWidth={48}
        />
      </Card>
    );
  };

  const renderCategoryComparison = () => {
    if (!analyses.length) return null;

    const categories = Array.from(
      new Set(analyses.flatMap(a => Object.keys(a.categories)))
    );

    const data = analyses.map(analysis => {
      const total = Object.values(analysis.categories).reduce((a, b) => a + b, 0);
      return {
        name: analysis.appName,
        ...Object.fromEntries(
          categories.map(cat => [
            cat,
            ((analysis.categories[cat] || 0) / total) * 100
          ])
        )
      };
    });

    return (
      <Card className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Kategori Dağılımı Karşılaştırması</h3>
        <BarChart
          className="mt-4 h-80"
          data={data}
          index="name"
          categories={categories}
          colors={['blue', 'emerald', 'purple', 'amber', 'rose']}
          valueFormatter={(value) => `${value.toFixed(1)}%`}
          yAxisWidth={48}
        />
      </Card>
    );
  };

  const renderRatingDistribution = () => {
    if (!analyses.length) return null;

    const data = analyses.map(analysis => {
      const total = Object.values(analysis.ratings).reduce((a, b) => a + b, 0);
      return {
        name: analysis.appName,
        '5 Yıldız': ((analysis.ratings['5'] || 0) / total) * 100,
        '4 Yıldız': ((analysis.ratings['4'] || 0) / total) * 100,
        '3 Yıldız': ((analysis.ratings['3'] || 0) / total) * 100,
        '2 Yıldız': ((analysis.ratings['2'] || 0) / total) * 100,
        '1 Yıldız': ((analysis.ratings['1'] || 0) / total) * 100,
      };
    });

    return (
      <Card className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Puan Dağılımı Karşılaştırması</h3>
        <BarChart
          className="mt-4 h-80"
          data={data}
          index="name"
          categories={['5 Yıldız', '4 Yıldız', '3 Yıldız', '2 Yıldız', '1 Yıldız']}
          colors={['emerald', 'teal', 'amber', 'orange', 'red']}
          valueFormatter={(value) => `${value.toFixed(1)}%`}
          yAxisWidth={48}
        />
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="sticky top-0 h-screen">
        <Sidebar />
      </div>
      
      <main className="flex-1 p-6 lg:p-8 transition-all duration-300">
        <div className="max-w-[1920px] mx-auto">
          {/* Başlık */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Rakip Analizleri</h1>
                <p className="mt-2 text-gray-600">
                  Rakip uygulamalarınızı analiz edin ve karşılaştırın
                </p>
              </div>
              {analyses.length > 0 && (
                <button
                  onClick={downloadExcel}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <FaFileExcel className="text-xl" />
                  <span>Excel Raporu İndir</span>
                </button>
              )}
            </div>
          </div>

          {/* Platform Seçimi */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Platform Seçimi</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handlePlatformChange('google')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  selectedPlatform === 'google'
                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white font-medium shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaGooglePlay className="text-xl" />
                <span className="font-medium">Google Play Store</span>
              </button>

              <button
                onClick={() => handlePlatformChange('apple')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  selectedPlatform === 'apple'
                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white font-medium shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaApple className="text-xl" />
                <span className="font-medium">App Store</span>
              </button>
            </div>
          </div>

          {/* Uygulama Linkleri */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Uygulama Linkleri</h2>
            
            {/* Ana Uygulama */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sizin Uygulamanız
              </label>
              <input
                type="text"
                value={mainAppUrl}
                onChange={(e) => setMainAppUrl(e.target.value)}
                placeholder={`${selectedPlatform === 'google' ? 'https://play.google.com/store/apps/details?id=...' : 'https://apps.apple.com/app/...'}`}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Rakip Uygulamalar */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Rakip Uygulamalar
              </label>
              {competitorUrls.map((url, index) => (
                <input
                  key={index}
                  type="text"
                  value={url}
                  onChange={(e) => handleCompetitorUrlChange(index, e.target.value)}
                  placeholder={`${index + 1}. Rakip ${selectedPlatform === 'google' ? 'Google Play' : 'App Store'} linki`}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              ))}
            </div>
          </div>

          {/* Analiz Butonu */}
          <div className="flex justify-end mb-8">
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className={`
                px-12 py-5 text-lg bg-gradient-to-br from-blue-500 to-blue-600 
                text-white rounded-xl shadow-lg hover:shadow-xl 
                transition-all duration-300 hover:scale-105
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isLoading ? 'Analiz Yapılıyor...' : 'Rakipleri Analiz Et'}
            </button>
          </div>

          {/* Hata Mesajı */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Analiz Sonuçları */}
          {analyses.length > 0 && (
            <div className="space-y-6">
              {/* İçgörüler */}
              <div className="grid grid-cols-1 gap-6">
                {analyses.map((analysis, index) => (
                  <Card key={`insights-${index}`} className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      {analysis.appName} - İçgörüler
                    </h3>
                    <div className="prose max-w-none">
                      <p className="text-gray-600 whitespace-pre-line">
                        {analysis.insights}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>

              {renderSentimentComparison()}
              {renderCategoryComparison()}
              {renderRatingDistribution()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 