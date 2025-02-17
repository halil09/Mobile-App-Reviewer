'use client';

import { useState } from 'react';
import { SocialMediaCard } from '@/components/social-media-card';
import { CompetitorCard } from '@/components/competitor-card';
import { FeedbackList } from '@/components/feedback-list';
import { PerformanceMetricsCard } from '@/components/performance-metrics-card';
import { Sidebar } from '@/components/sidebar';
import { sampleData } from '@/constants/sample-data';
import { FaChartLine, FaUsers, FaComments, FaChartBar, FaGooglePlay, FaApple, FaStar, FaRegStar, FaFileExcel } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, Title, DonutChart, BarChart } from "@tremor/react";
import * as XLSX from 'xlsx';

const pieChartData = [
  { name: 'Twitter', value: 35 },
  { name: 'Facebook', value: 25 },
  { name: 'Instagram', value: 30 },
  { name: 'LinkedIn', value: 10 },
];

const COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#0284C7'];

const lineChartData = [
  { name: 'Ocak', etkileşim: 4000, takipçi: 2400 },
  { name: 'Şubat', etkileşim: 3000, takipçi: 1398 },
  { name: 'Mart', etkileşim: 2000, takipçi: 9800 },
  { name: 'Nisan', etkileşim: 2780, takipçi: 3908 },
  { name: 'Mayıs', etkileşim: 1890, takipçi: 4800 },
  { name: 'Haziran', etkileşim: 2390, takipçi: 3800 },
];

const donutChartData = [
  { name: 'Olumlu', value: 65 },
  { name: 'Nötr', value: 20 },
  { name: 'Olumsuz', value: 15 },
];

type Platform = 'google' | 'apple';

interface AppleReview {
  id: string;
  userName: string;
  title: string;
  text: string;
  score: number;
  date: Date;
}

interface GoogleReview {
  id: string;
  userName: string;
  title: string;
  text: string;
  score: number;
  date: Date;
}

interface GoogleAppInfo {
  title: string;
  description: string;
  score: number;
  ratings: number;
  reviews: number;
  currentVersion: string;
  developer: string;
  developerId: string;
  developerEmail: string;
  developerWebsite: string;
  genre: string;
  price: string;
  free: boolean;
  icon: string;
}

interface SentimentStatistics {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
}

interface AnalyzedReview extends GoogleReview {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidenceScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface AnalyzedAppleReview extends AppleReview {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidenceScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

// Yeni chart verileri için yardımcı fonksiyonlar
const prepareRatingDistributionData = (reviews: GoogleReview[] | AppleReview[]) => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    distribution[review.score as keyof typeof distribution]++;
  });
  return Object.entries(distribution).map(([rating, count]) => ({
    rating: `${rating} Yıldız`,
    count
  }));
};

const prepareSentimentTrendData = (reviews: AnalyzedReview[] | AnalyzedAppleReview[]) => {
  const groupedByDate = reviews.reduce((acc, review) => {
    const date = new Date(review.date).toLocaleDateString('tr-TR');
    if (!acc[date]) {
      acc[date] = { positive: 0, neutral: 0, negative: 0 };
    }
    acc[date][review.sentiment]++;
    return acc;
  }, {} as Record<string, { positive: number; neutral: number; negative: number; }>);

  return Object.entries(groupedByDate).map(([date, counts]) => ({
    date,
    ...counts
  }));
};

export function DashboardView() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('google');
  const [googlePlayUrl, setGooglePlayUrl] = useState('');
  const [appStoreUrl, setAppStoreUrl] = useState('');
  const [appleReviews, setAppleReviews] = useState<AppleReview[]>([]);
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleReviewCount, setVisibleReviewCount] = useState(10);
  const [visibleGoogleReviewCount, setVisibleGoogleReviewCount] = useState(10);
  const [googleAppInfo, setGoogleAppInfo] = useState<GoogleAppInfo | null>(null);
  const [analyzedReviews, setAnalyzedReviews] = useState<AnalyzedReview[]>([]);
  const [sentimentStats, setSentimentStats] = useState<SentimentStatistics | null>(null);
  const [analyzedAppleReviews, setAnalyzedAppleReviews] = useState<AnalyzedAppleReview[]>([]);
  const [appleSentimentStats, setAppleSentimentStats] = useState<SentimentStatistics | null>(null);

  const getAppIdFromUrl = (url: string) => {
    const match = url.match(/id(\d+)/);
    return match ? match[1] : null;
  };

  const getGoogleAppIdFromUrl = (url: string) => {
    const match = url.match(/id=([^&]+)/);
    return match ? match[1] : null;
  };

  const analyzeSentiment = async (reviews: (GoogleReview | AppleReview)[], platform: 'google' | 'apple') => {
    try {
      const response = await fetch('/api/sentiment-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviews }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Duygu analizi yapılırken bir hata oluştu");
      }

      if (platform === 'google') {
        setAnalyzedReviews(data.reviews);
        setSentimentStats(data.statistics);
      } else {
        setAnalyzedAppleReviews(data.reviews);
        setAppleSentimentStats(data.statistics);
      }
    } catch (err) {
      console.error('Duygu analizi hatası:', err);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setVisibleReviewCount(10);
    setVisibleGoogleReviewCount(10);
    setAnalyzedReviews([]);
    setSentimentStats(null);
    setAnalyzedAppleReviews([]);
    setAppleSentimentStats(null);
    
    try {
      let analysisData = {
        platform: selectedPlatform,
        appInfo: null,
        analyzedReviews: [],
        statistics: null
      };

      if (selectedPlatform === 'apple') {
        const appId = getAppIdFromUrl(appStoreUrl);
        
        if (!appId) {
          throw new Error("Geçerli bir App Store URLsi giriniz");
        }

        const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ appId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Yorumlar çekilirken bir hata oluştu");
        }

        setAppleReviews(data.reviews);
        
        // Apple yorumlarını analiz et
        const sentimentResponse = await fetch('/api/sentiment-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reviews: data.reviews }),
        });

        const sentimentData = await sentimentResponse.json();
        
        if (!sentimentResponse.ok) {
          throw new Error(sentimentData.error || "Duygu analizi yapılırken bir hata oluştu");
        }

        setAnalyzedAppleReviews(sentimentData.reviews);
        setAppleSentimentStats(sentimentData.statistics);

        // Analiz verilerini güncelle
        analysisData = {
          ...analysisData,
          analyzedReviews: sentimentData.reviews.map((review: any) => ({
            ...review,
            mainCategory: getMainCategory(review.text),
            subCategory: getSubCategory(getMainCategory(review.text), review.text),
            keywords: getKeywords(review.text),
            sentimentScore: getRandomScore(review.sentiment)
          })),
          statistics: sentimentData.statistics
        };
      }

      if (selectedPlatform === 'google') {
        const appId = getGoogleAppIdFromUrl(googlePlayUrl);
        
        if (!appId) {
          throw new Error("Geçerli bir Google Play Store URLsi giriniz");
        }

        const response = await fetch('/api/google-reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ appId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Google Play Store yorumları çekilirken bir hata oluştu");
        }

        setGoogleReviews(data.reviews);
        setGoogleAppInfo(data.appInfo);

        // Yorumları analiz et
        const sentimentResponse = await fetch('/api/sentiment-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reviews: data.reviews }),
        });

        const sentimentData = await sentimentResponse.json();

        if (!sentimentResponse.ok) {
          throw new Error(sentimentData.error || "Duygu analizi yapılırken bir hata oluştu");
        }

        setAnalyzedReviews(sentimentData.reviews);
        setSentimentStats(sentimentData.statistics);

        // Analiz verilerini güncelle
        analysisData = {
          ...analysisData,
          appInfo: data.appInfo,
          analyzedReviews: sentimentData.reviews.map((review: any) => ({
            ...review,
            mainCategory: getMainCategory(review.text),
            subCategory: getSubCategory(getMainCategory(review.text), review.text),
            keywords: getKeywords(review.text),
            sentimentScore: getRandomScore(review.sentiment)
          })),
          statistics: sentimentData.statistics
        };
      }

      // Analiz sonuçlarını kaydet
      const saveResponse = await fetch('/api/save-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (!saveResponse.ok) {
        console.error('Analiz kaydedilemedi:', await saveResponse.json());
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yorumlar çekilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformChange = (platform: Platform) => {
    setSelectedPlatform(platform);
    // Sadece URL'leri temizle
    setGooglePlayUrl('');
    setAppStoreUrl('');
    setError(null);
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= score ? (
            <FaStar key={star} className="text-yellow-400" />
          ) : (
            <FaRegStar key={star} className="text-yellow-400" />
          )
        ))}
      </div>
    );
  };

  const handleShowMore = () => {
    setVisibleReviewCount(prev => Math.min(prev + 10, appleReviews.length));
  };

  const handleShowMoreGoogle = () => {
    setVisibleGoogleReviewCount(prev => Math.min(prev + 10, googleReviews.length));
  };

  const getRandomScore = (sentiment: string): number => {
    switch (sentiment) {
      case 'negative':
        return Math.floor(Math.random() * (35 - 10 + 1)) + 10; // 10-35 arası
      case 'neutral':
        return Math.floor(Math.random() * (60 - 40 + 1)) + 40; // 40-60 arası
      case 'positive':
        return Math.floor(Math.random() * (90 - 65 + 1)) + 65; // 65-90 arası
      default:
        return 50;
    }
  };

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
      // Performans
      'yavaş', 'hızlı', 'donma', 'kasma', 'çökme', 'bug', 'hata', 'performans',
      // Kullanılabilirlik
      'kullanım', 'arayüz', 'tasarım', 'menü', 'kolay', 'zor', 'karmaşık',
      // Özellikler
      'özellik', 'güncelleme', 'yenilik', 'fonksiyon',
      // Güvenlik
      'güvenlik', 'gizlilik', 'şifre', 'hesap',
      // Teknik
      'bağlantı', 'internet', 'sunucu', 'çöküyor',
      // Müşteri Hizmetleri
      'destek', 'yardım', 'iletişim', 'çözüm',
      // Fiyatlandırma
      'ücret', 'fiyat', 'pahalı', 'ucuz', 'ödeme',
      // İçerik
      'içerik', 'reklam', 'bilgi', 'veri'
    ];

    const lowercaseText = text.toLowerCase();
    return keywords.filter(keyword => lowercaseText.includes(keyword));
  };

  const downloadExcel = (platform: 'apple' | 'google') => {
    const reviews = platform === 'apple' ? analyzedAppleReviews : analyzedReviews;
    const appInfo = platform === 'apple' ? null : googleAppInfo;
    
    // Excel için veriyi hazırla
    const data = reviews.map(review => {
      const mainCategory = getMainCategory(review.text);
      const subCategory = getSubCategory(mainCategory, review.text);
      const keywords = getKeywords(review.text);

      return {
        'Kullanıcı Adı': review.userName,
        'Puan': review.score,
        'Yorum': review.text,
        'Duygu Analizi': getSentimentText(review.sentiment),
        'Duygu Puanı': getRandomScore(review.sentiment),
        'Ana Kategori': mainCategory,
        'Alt Kategori': subCategory,
        'Anahtar Kelimeler': keywords.join(', '),
        'Tarih': new Date(review.date).toLocaleDateString('tr-TR')
      };
    });

    // Excel dosyası oluştur
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yorumlar");

    // Sütun genişliklerini ayarla
    const colWidths = [
      { wch: 20 }, // Kullanıcı Adı
      { wch: 8 },  // Puan
      { wch: 50 }, // Yorum
      { wch: 15 }, // Duygu Analizi
      { wch: 12 }, // Duygu Puanı
      { wch: 15 }, // Ana Kategori
      { wch: 20 }, // Alt Kategori
      { wch: 30 }, // Anahtar Kelimeler
      { wch: 15 }  // Tarih
    ];
    ws['!cols'] = colWidths;

    // Dosyayı indir
    const appName = platform === 'apple' ? 'AppStore' : (googleAppInfo?.title || 'GooglePlay');
    XLSX.writeFile(wb, `${appName}_Yorumlar.xlsx`);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'Olumlu';
      case 'negative':
        return 'Olumsuz';
      default:
        return 'Nötr';
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="sticky top-0 h-screen">
        <Sidebar />
      </div>
      
      <main className="flex-1 p-6 lg:p-8 transition-all duration-300">
        <div className="max-w-[1920px] mx-auto">
          {/* Başlık */}
          <div className="mb-16">
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-extrabold bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent tracking-tight leading-tight">
              Mobile App Insight Analyzer
            </h1>
            <p className="mt-4 text-base text-gray-600">
              Mobil uygulama yorumlarını analiz ederek kullanıcı deneyimini iyileştirin
            </p>
          </div>

          {/* Platform Seçimi ve URL Girişi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6">
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

            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Uygulama Linki</h2>
              <div className="space-y-4">
                {selectedPlatform === 'google' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Play Store URL
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={googlePlayUrl}
                        onChange={(e) => setGooglePlayUrl(e.target.value)}
                        placeholder="https://play.google.com/store/apps/details?id=..."
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                {selectedPlatform === 'apple' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      App Store URL
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={appStoreUrl}
                        onChange={(e) => setAppStoreUrl(e.target.value)}
                        placeholder="https://apps.apple.com/app/..."
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analiz Butonu */}
          <div className="flex justify-end mb-8">
            <button
              onClick={handleAnalyze}
              className="px-12 py-5 text-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Yorumları Analiz Et
            </button>
          </div>

          {/* Yükleniyor ve Hata Durumları */}
          {isLoading && (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-6">
              <p className="text-center text-gray-600">Yorumlar yükleniyor...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-6">
              <p className="text-center text-red-600">{error}</p>
            </div>
          )}

          {/* Analiz Sonuçları */}
          {(analyzedReviews.length > 0 || analyzedAppleReviews.length > 0) && (
            <div className="space-y-6">
              {/* Yorumlar */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <h2 className="text-xl font-semibold text-gray-800">Uygulama Yorumları</h2>
                    <span className="text-sm text-gray-500">
                      Toplam {selectedPlatform === 'google' ? analyzedReviews.length : analyzedAppleReviews.length} yorum
                    </span>
                  </div>
                  {(analyzedReviews.length > 0 || analyzedAppleReviews.length > 0) && (
                    <button
                      onClick={() => downloadExcel(selectedPlatform)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-xl hover:bg-green-200 transition-all duration-300 w-full sm:w-auto shadow-md hover:shadow-lg"
                    >
                      <FaFileExcel className="text-xl" />
                      <span className="font-medium">Excel İndir</span>
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {(selectedPlatform === 'google' ? analyzedReviews : analyzedAppleReviews)
                    .slice(0, visibleReviewCount)
                    .map((review) => {
                      const mainCategory = getMainCategory(review.text);
                      const subCategory = getSubCategory(mainCategory, review.text);
                      const keywords = getKeywords(review.text);
                      const sentimentScore = getRandomScore(review.sentiment);
                      
                      return (
                        <div key={review.id} className="flex flex-col gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                          {/* Üst Kısım - Kullanıcı Bilgisi ve Yıldızlar */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">{review.userName.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{review.userName}</p>
                                <p className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString('tr-TR')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {renderStars(review.score)}
                            </div>
                          </div>

                          {/* Yorum İçeriği */}
                          <p className="text-gray-700">{review.text}</p>

                          {/* Alt Kısım - Analiz Sonuçları */}
                          <div className="mt-4 space-y-4">
                            {/* Duygu Analizi ve Puan */}
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                review.sentiment === 'positive' 
                                  ? 'bg-green-100 text-green-700' 
                                  : review.sentiment === 'negative'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {getSentimentText(review.sentiment)}
                              </span>
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                                <span className="text-sm font-medium text-blue-700">Duygu Puanı:</span>
                                <span className={`text-sm font-bold ${
                                  sentimentScore >= 65 
                                    ? 'text-green-600' 
                                    : sentimentScore >= 40 
                                    ? 'text-blue-600' 
                                    : 'text-red-600'
                                }`}>
                                  {sentimentScore}
                                </span>
                              </div>
                            </div>

                            {/* Kategoriler */}
                            <div className="flex flex-wrap gap-4">
                              {/* Ana Kategori */}
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-500 mb-1 ml-1">
                                  Ana Kategori
                                </span>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                  <span className="text-sm font-medium text-purple-700">
                                    {mainCategory}
                                  </span>
                                </div>
                              </div>

                              {/* Alt Kategori */}
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-500 mb-1 ml-1">
                                  Alt Kategori
                                </span>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg">
                                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                  <span className="text-sm font-medium text-indigo-700">
                                    {subCategory}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Anahtar Kelimeler */}
                            {keywords.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {keywords.map((keyword, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs"
                                  >
                                    #{keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Daha Fazla Göster Butonu */}
                {(selectedPlatform === 'google' ? analyzedReviews.length : analyzedAppleReviews.length) > visibleReviewCount && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setVisibleReviewCount(prev => prev + 10)}
                      className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-300"
                    >
                      Daha Fazla Göster
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 