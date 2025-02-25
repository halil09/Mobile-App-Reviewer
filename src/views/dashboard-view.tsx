'use client';

import { useState } from 'react';
import { SocialMediaCard } from '@/components/social-media-card';
import { CompetitorCard } from '@/components/competitor-card';
import { FeedbackList } from '@/components/feedback-list';
import { PerformanceMetricsCard } from '@/components/performance-metrics-card';
import { Sidebar } from '@/components/sidebar';
import { sampleData } from '@/constants/sample-data';
import { FaChartLine, FaUsers, FaComments, FaChartBar, FaGooglePlay, FaApple, FaStar, FaStarHalf, FaRegStar, FaFileExcel, FaChartPie } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Card, Title, DonutChart, BarChart as TremorBarChart } from "@tremor/react";
import * as XLSX from 'xlsx';

// Anahtar kelime analizi için yardımcı fonksiyon
const getKeywords = (text: string): string[] => {
  // Metni küçük harfe çevir ve noktalama işaretlerini kaldır
  const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  
  // Stopwords - çıkarılacak yaygın kelimeler
  const stopwords = ['ve', 'veya', 'bir', 'bu', 'şu', 'için', 'ile', 'de', 'da', 'ki', 'den', 'dan'];
  
  // Kelimelere ayır
  const words = cleanText.split(' ');
  
  // Stopwords'leri çıkar ve en az 3 karakter olan kelimeleri al
  const filteredWords = words.filter(word => 
    word.length >= 3 && !stopwords.includes(word)
  );
  
  // Tekrar eden kelimeleri çıkar ve en fazla 5 kelime al
  return Array.from(new Set(filteredWords)).slice(0, 5);
};

const pieChartData = [
  { name: 'Twitter', value: 35 },
  { name: 'Facebook', value: 25 },
  { name: 'Instagram', value: 30 },
  { name: 'LinkedIn', value: 10 },
];

const COLORS = {
  positive: '#22c55e',
  neutral: '#64748b',
  negative: '#ef4444',
  primary: '#3b82f6',
  secondary: '#6366f1',
  accent: '#8b5cf6',
  background: '#f8fafc'
};

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
  insights?: string;
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

interface AppleAppInfo {
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
  insights?: string;
}

interface SaveAnalysisParams {
  platform: Platform;
  appInfo: GoogleAppInfo | AppleAppInfo | null;
  analyzedReviews: AnalyzedReview[];
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

// Grafik bileşenleri
const SentimentDistributionChart = ({ data }: { data: any }) => {
  const total = data.total || 0;
  const chartData = [
    { name: 'Olumlu', value: data.positive || 0, color: '#22c55e' }, // Yeşil
    { name: 'Nötr', value: data.neutral || 0, color: '#94a3b8' },   // Gri
    { name: 'Olumsuz', value: data.negative || 0, color: '#ef4444' } // Kırmızı
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaChartPie className="text-blue-500" />
        Duygu Durum Dağılımı
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} yorum`, ``]}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            />
            <Legend 
              formatter={(value) => <span style={{ color: chartData.find(item => item.name === value)?.color }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CategoryDistributionChart = ({ categories }: { categories: any }) => {
  return (
    <Card>
      <Title>Kategori Dağılımı</Title>
      <TremorBarChart
        data={Object.entries(categories).map(([name, value]) => ({
          name,
          value
        }))}
        index="name"
        categories={["value"]}
        colors={["blue"]}
        className="mt-6"
      />
    </Card>
  );
};

const ReviewCountTrendChart = ({ analyzedReviews }: { analyzedReviews: AnalyzedReview[] }) => {
  // Yorumları tarihe göre grupla
  const reviewsByDate = analyzedReviews.reduce((acc: { [key: string]: number }, review) => {
    const date = new Date(review.date).toLocaleDateString('tr-TR');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Tarihleri sırala ve veriyi formatlı
  const data = Object.entries(reviewsByDate)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .map(([date, count]) => ({
      date,
      count
    }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaChartBar className="text-blue-500" />
        Günlük Yorum Sayısı Trendi
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`${value} yorum`, 'Yorum Sayısı']}
            labelFormatter={(label) => `Tarih: ${label}`}
          />
          <Bar dataKey="count" fill={COLORS.primary} name="Yorum Sayısı" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const WordCloud = ({ analyzedReviews }: { analyzedReviews: AnalyzedReview[] }) => {
  // Tüm yorumlardan anahtar kelimeleri çıkar
  const keywords = analyzedReviews.flatMap(review => getKeywords(review.text));
  const wordCount = keywords.reduce((acc: { [key: string]: number }, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  // En çok geçen 30 kelimeyi al
  const topWords = Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([text, value]) => ({ text, value }));

  return (
    <Card>
      <Title>Anahtar Kelime Bulutu</Title>
      <div className="mt-4 h-72 flex flex-wrap gap-2 justify-center items-center p-4">
        {topWords.map(({ text, value }) => (
          <span
            key={text}
            className="inline-block px-2 py-1 rounded-full"
            style={{
              fontSize: `${Math.max(0.8, Math.min(2, value / Math.max(...Object.values(wordCount)) * 2))}rem`,
              opacity: Math.max(0.5, value / Math.max(...Object.values(wordCount))),
              backgroundColor: `rgba(59, 130, 246, ${value / Math.max(...Object.values(wordCount))})`,
              color: 'white'
            }}
          >
            {text}
          </span>
        ))}
      </div>
    </Card>
  );
};

const SentimentScore = ({ analyzedReviews }: { analyzedReviews: AnalyzedReview[] }) => {
  // Her yorumun duygu puanını hesapla ve ortalamasını al
  const averageSentiment = analyzedReviews.reduce((acc, review) => {
    const scores = review.confidenceScores;
    // Pozitif: 1, Nötr: 0, Negatif: -1 olarak değerlendir
    const sentimentValue = scores.positive - scores.negative;
    return acc + sentimentValue;
  }, 0) / analyzedReviews.length;

  // Puanı 0-100 aralığına dönüştür
  const normalizedScore = ((averageSentiment + 1) / 2) * 100;

  return (
    <Card>
      <Title>Ortalama Duygu Puanı</Title>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-gray-700">
            {normalizedScore.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">/ 100</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${normalizedScore}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-500 text-center">
          {normalizedScore >= 75 ? 'Çok İyi' :
           normalizedScore >= 60 ? 'İyi' :
           normalizedScore >= 40 ? 'Orta' :
           normalizedScore >= 25 ? 'Kötü' : 'Çok Kötü'}
        </div>
      </div>
    </Card>
  );
};

const getAppNameFromUrl = (url: string): string => {
  const match = url.match(/id=com\.(.*?)(&|$)/);
  if (match && match[1]) {
    // İlk harfi büyük yap, geri kalanı küçük bırak
    return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  }
  return 'Uygulama Adı';
};

const calculateAverageRating = (reviews: AnalyzedReview[]): number => {
  if (!reviews || reviews.length === 0) return 0;
  
  const totalScore = reviews.reduce((sum, review) => sum + (review.score || 0), 0);
  return Number((totalScore / reviews.length).toFixed(1));
};

const generateInsights = async (analyzedReviews: AnalyzedReview[], statistics: SentimentStatistics) => {
  try {
    // Analiz verilerini hazırla
    const analysisData = {
      statistics,
      categories: analyzeCategories(analyzedReviews),
      ratings: analyzedReviews.reduce((acc: { [key: string]: number }, review) => {
        acc[review.score] = (acc[review.score] || 0) + 1;
        return acc;
      }, {}),
      sentimentTrend: analyzedReviews.map(review => ({
        date: new Date(review.date).toLocaleDateString('tr-TR'),
        text: review.text,
        sentiment: review.sentiment
      }))
    };

    // Gemini API'yi çağır
    const response = await fetch('/api/generate-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisData),
    });

    if (!response.ok) {
      throw new Error('İçgörü oluşturulamadı');
    }

    const { insights } = await response.json();
    return insights;

  } catch (error) {
    console.error('İçgörü oluşturma hatası:', error);
    
    // Hata durumunda basit bir içgörü metni döndür
    const totalReviews = statistics.total;
    const positiveRatio = ((statistics.positive / totalReviews) * 100).toFixed(1);
    const neutralRatio = ((statistics.neutral / totalReviews) * 100).toFixed(1);
    const negativeRatio = ((statistics.negative / totalReviews) * 100).toFixed(1);
    const averageRating = calculateAverageRating(analyzedReviews);

    return `Uygulama Değerlendirme Özeti:

Genel Duygu Durumu:
• Toplam ${totalReviews} yorum analiz edildi
• %${positiveRatio} olumlu, %${neutralRatio} nötr, %${negativeRatio} olumsuz yorum
• Ortalama puanlama: ${averageRating.toFixed(1)}/5

Not: Detaylı içgörü analizi oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.`;
  }
};

export function DashboardView() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('google');
  const [appUrl, setAppUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleReviewCount, setVisibleReviewCount] = useState(10);
  const [visibleGoogleReviewCount, setVisibleGoogleReviewCount] = useState(10);
  const [googleAppInfo, setGoogleAppInfo] = useState<GoogleAppInfo | null>(null);
  const [analyzedReviews, setAnalyzedReviews] = useState<AnalyzedReview[]>([]);
  const [statistics, setStatistics] = useState<SentimentStatistics | null>(null);
  const [appleAppInfo, setAppleAppInfo] = useState<AppleAppInfo | null>(null);
  const [categories, setCategories] = useState<{[key: string]: number}>({});
  const [sentimentTrend, setSentimentTrend] = useState<any[]>([]);

  const getAppIdFromUrl = (url: string) => {
    const match = url.match(/id(\d+)/);
    return match ? match[1] : null;
  };

  const getGoogleAppIdFromUrl = (url: string) => {
    const match = url.match(/id=([^&]+)/);
    const appId = match ? match[1] : null;
    
    // Uygulama adını çıkar
    if (appId) {
      const appName = appId.split('com.')[1];
      if (appName) {
        // İlk harfi büyük yap
        return {
          id: appId,
          name: appName.charAt(0).toUpperCase() + appName.slice(1)
        };
      }
    }
    return null;
  };

  const handleAnalyze = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let appId;
      let appName;

      if (selectedPlatform === 'google') {
        const googleAppData = getGoogleAppIdFromUrl(appUrl);
        if (!googleAppData) {
          throw new Error('Geçersiz Google Play Store URL\'si');
        }
        appId = googleAppData.id;
        appName = googleAppData.name;
      } else {
        appId = getAppIdFromUrl(appUrl);
        if (!appId) {
          throw new Error('Geçersiz App Store URL\'si');
        }
      }

      // Yorumları getir
      const response = await fetch('/api/get-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          appId,
          appName // Uygulama adını da gönder
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Yorumlar çekilirken bir hata oluştu');
      }

      const reviewsData = await response.json();

      // Duygu analizi yap
      try {
        const sentimentResponse = await fetch('/api/sentiment-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reviews: reviewsData.reviews.map((review: any) => ({
              id: review.id,
              text: review.text
            }))
          }),
        });

        if (!sentimentResponse.ok) {
          const errorData = await sentimentResponse.json();
          throw new Error(errorData.error || 'Duygu analizi yapılırken bir hata oluştu');
        }

        const sentimentData = await sentimentResponse.json();

        // Analiz sonuçlarını birleştir
        const analyzedReviews = reviewsData.reviews.map((review: any, index: number) => ({
          ...review,
          ...sentimentData.reviews[index]
        }));

        // İstatistikleri güncelle
        setStatistics(sentimentData.statistics);

        // Kategorileri analiz et ve güncelle
        const categoryData = await analyzeCategories(analyzedReviews);
        setCategories(categoryData);

        // Trend verilerini hazırla ve güncelle
        const trendData = prepareSentimentTrendData(analyzedReviews);
        setSentimentTrend(trendData);

        // Uygulama bilgilerini güncelle
        if (selectedPlatform === 'google') {
          setGoogleAppInfo({
            ...reviewsData.appInfo,
            score: calculateAverageRating(analyzedReviews),
            ratings: analyzedReviews.length,
            reviews: analyzedReviews.length
          });
        } else {
          setAppleAppInfo(reviewsData.appInfo);
        }

        // Analiz edilmiş yorumları güncelle
        setAnalyzedReviews(analyzedReviews);

        // İçgörüleri oluştur
        const insights = await generateInsights(analyzedReviews, sentimentData.statistics);
        
        // Uygulama bilgilerini güncelle
        if (selectedPlatform === 'google') {
          setGoogleAppInfo(prev => prev ? { ...prev, insights } : null);
        } else {
          setAppleAppInfo(prev => prev ? { ...prev, insights } : null);
        }

      } catch (error) {
        setError(error instanceof Error ? error.message : 'Duygu analizi yapılırken bir hata oluştu');
        return;
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Analiz yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformChange = (platform: Platform) => {
    setSelectedPlatform(platform);
    setAppUrl('');
    setError(null);
    setAnalyzedReviews([]);
    setStatistics(null);
    setGoogleAppInfo(null);
    setAppleAppInfo(null);
    setCategories({});
    setSentimentTrend([]);
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
    setVisibleReviewCount(prev => Math.min(prev + 10, 50));
  };

  const handleShowMoreGoogle = () => {
    setVisibleGoogleReviewCount(prev => Math.min(prev + 10, analyzedReviews.length));
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
      'Performans': ['yavaş', 'donma', 'kasma', 'hızlı', 'çökme', 'bug', 'hata'],
      'Kullanılabilirlik': ['kullanımı', 'arayüz', 'tasarım', 'kolay', 'karmaşık'],
      'Özellikler': ['özellik', 'fonksiyon', 'güncelleme', 'yenilik'],
      'Güvenlik': ['güvenlik', 'gizlilik', 'şifre', 'hesap'],
      'Fiyatlandırma': ['ücret', 'fiyat', 'pahalı', 'ücretsiz'],
      'Destek': ['destek', 'yardım', 'iletişim', 'müşteri hizmetleri']
    };

    const text_lower = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text_lower.includes(keyword))) {
        return category;
      }
    }
    
    return 'Genel';
  };

  const getSubCategory = (mainCategory: string, text: string): string => {
    const subCategories = {
      'Performans': {
        'Hız': ['yavaş', 'hızlı', 'akıcı', 'geç'],
        'Stabilite': ['donma', 'kasma', 'çökme', 'bug'],
        'Sistem Kullanımı': ['ram', 'pil', 'şarj', 'ısınma']
      },
      'Kullanılabilirlik': {
        'Arayüz': ['arayüz', 'tasarım', 'düzen', 'görünüm'],
        'Navigasyon': ['menü', 'gezinme', 'buton', 'sayfa'],
        'Erişilebilirlik': ['kolay', 'zor', 'karmaşık', 'basit']
      },
      'Özellikler': {
        'Yeni Özellikler': ['yeni', 'güncelleme', 'eklendi'],
        'Eksik Özellikler': ['eksik', 'yok', 'kaldırılmış'],
        'Hatalı Özellikler': ['çalışmıyor', 'bozuk', 'hatalı']
      },
      'Güvenlik': {
        'Hesap Güvenliği': ['şifre', 'hesap', 'giriş'],
        'Veri Güvenliği': ['veri', 'bilgi', 'gizlilik'],
        'Doğrulama': ['doğrulama', 'kod', 'sms']
      },
      'Fiyatlandırma': {
        'Ücretlendirme': ['ücret', 'fiyat', 'pahalı'],
        'Abonelik': ['abonelik', 'üyelik', 'aylık'],
        'İade': ['iade', 'geri ödeme', 'iptal']
      },
      'Destek': {
        'Müşteri Hizmetleri': ['destek', 'yardım', 'iletişim'],
        'Dokümantasyon': ['kılavuz', 'yardım', 'bilgi'],
        'Yanıt Süresi': ['yanıt', 'cevap', 'bekleme']
      }
    };

    const text_lower = text.toLowerCase();
    const categorySubCategories = subCategories[mainCategory as keyof typeof subCategories];
    
    if (categorySubCategories) {
      for (const [subCategory, keywords] of Object.entries(categorySubCategories)) {
        if (keywords.some(keyword => text_lower.includes(keyword))) {
          return subCategory;
        }
      }
    }
    
    return 'Diğer';
  };

  const saveAnalysis = async ({ platform, appInfo, analyzedReviews }: SaveAnalysisParams) => {
    try {
      // Her yorum için sentimentScore hesapla
      const reviewsWithScores = analyzedReviews.map((review: AnalyzedReview) => ({
        ...review,
        sentimentScore: getRandomScore(review.sentiment),
        mainCategory: getMainCategory(review.text),
        subCategory: getSubCategory(getMainCategory(review.text), review.text),
        keywords: getKeywords(review.text)
      }));

      const response = await fetch('/api/save-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          appInfo,
          analyzedReviews: reviewsWithScores,
          statistics
        }),
      });

      if (!response.ok) {
        throw new Error('Analiz kaydedilirken bir hata oluştu');
      }

      alert('Analiz başarıyla kaydedildi!');
    } catch (error) {
      alert('Analiz kaydedilirken bir hata oluştu');
    }
  };

  const downloadExcel = async () => {
    if (!analyzedReviews.length) return;

    const workbook = XLSX.utils.book_new();

    // Kategorileri analiz et
    const reviewCategories = await analyzeCategories([...analyzedReviews]);

    // Tüm Yorumlar Sayfası
    const reviewsData = analyzedReviews.map(review => {
      // Her yorum için kategoriyi belirle
      const reviewText = review.text.toLowerCase();
      let category = 'Diğer';
      
      // Müşteri Memnuniyeti kontrolü
      const customerSatisfactionKeywords = [
        'süper', 'harika', 'mükemmel', 'muhteşem', 'çok iyi', 'başarılı', 'güzel',
        'berbat', 'rezalet', 'kötü', 'felaket', 'korkunç', 'vasat', 'yetersiz'
      ];
      
      if (customerSatisfactionKeywords.some(keyword => reviewText.includes(keyword)) ||
          (reviewText.split(' ').length <= 3 && (reviewText.includes('👍') || reviewText.includes('👎')))) {
        category = 'Müşteri Memnuniyeti';
      } else {
        // Diğer kategorileri kontrol et
        const categories = {
          'Performans': ['yavaş', 'donma', 'kasma', 'gecikme', 'çökme', 'bug', 'hata'],
          'Kullanılabilirlik': ['kullanımı', 'arayüz', 'tasarım', 'menü', 'kolay', 'karmaşık'],
          'Özellikler': ['özellik', 'fonksiyon', 'güncelleme', 'yenilik'],
          'Güvenlik': ['güvenlik', 'gizlilik', 'şifre', 'hesap']
        };

        for (const [cat, keywords] of Object.entries(categories)) {
          if (keywords.some(keyword => reviewText.includes(keyword))) {
            category = cat;
            break;
          }
        }
      }

      return {
        'Yorum Metni': review.text,
        'Duygu Analizi': getSentimentText(review.sentiment),
        'Duygu Puanı': getRandomScore(review.sentiment),
        'Ana Kategori': category,
        'Alt Kategori': category === 'Müşteri Memnuniyeti' ? 
          (review.sentiment === 'positive' ? 'Olumlu Geri Bildirim' : 
           review.sentiment === 'negative' ? 'Olumsuz Geri Bildirim' : 'Nötr Geri Bildirim') : 
          'Genel',
        'Anahtar Kelimeler': getKeywords(review.text).join(', '),
        'Puan': review.score,
        'Tarih': new Date(review.date).toLocaleDateString('tr-TR')
      };
    });

    const reviewsSheet = XLSX.utils.json_to_sheet(reviewsData);
    XLSX.utils.book_append_sheet(workbook, reviewsSheet, "Tüm Yorumlar");

    // Kategori İstatistikleri Sayfası
    const categoryStats = Object.entries(reviewCategories).map(([category, count]) => ({
      'Kategori': category,
      'Yorum Sayısı': count,
      'Oran': `${((count / analyzedReviews.length) * 100).toFixed(1)}%`
    }));

    const categorySheet = XLSX.utils.json_to_sheet(categoryStats);
    XLSX.utils.book_append_sheet(workbook, categorySheet, "Kategori İstatistikleri");

    // Duygu Analizi İstatistikleri Sayfası
    const statsData = [{
      'Toplam Yorum': statistics?.total || 0,
      'Olumlu Yorum': statistics?.positive || 0,
      'Nötr Yorum': statistics?.neutral || 0,
      'Olumsuz Yorum': statistics?.negative || 0,
      'Olumlu Oran': `${(((statistics?.positive || 0) / (statistics?.total || 1)) * 100).toFixed(1)}%`,
      'Nötr Oran': `${(((statistics?.neutral || 0) / (statistics?.total || 1)) * 100).toFixed(1)}%`,
      'Olumsuz Oran': `${(((statistics?.negative || 0) / (statistics?.total || 1)) * 100).toFixed(1)}%`
    }];

    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, "Duygu Analizi İstatistikleri");

    // Excel dosyasını indir
    XLSX.writeFile(workbook, `${googleAppInfo?.title || 'Uygulama'}_Analiz_Raporu.xlsx`);
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
      
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-[1920px] mx-auto space-y-6">
          {/* Başlık ve Kontroller */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Genel Bakış</h1>
              <p className="text-gray-600">Kullanıcı yorumlarını analiz edin ve içgörüler elde edin</p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={selectedPlatform}
                onChange={(e) => handlePlatformChange(e.target.value as Platform)}
                className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="google">Google Play Store</option>
                <option value="apple">App Store</option>
              </select>
            </div>
          </div>

          {/* URL Girişi ve Analiz Butonu */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder={`${selectedPlatform === 'google' ? 'Google Play Store' : 'App Store'} uygulama URLsi girin`}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className={`
                  px-6 py-2 rounded-xl text-white
                  ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}
                  transition-colors
                `}
              >
                {isLoading ? 'Analiz Ediliyor...' : 'Analiz Et'}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl">
                {error}
              </div>
            )}
          </div>

          {/* Analiz Sonuçları */}
          {analyzedReviews.length > 0 && (
            <div className="space-y-6">
              {/* Excel ve Kaydetme Butonları */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => saveAnalysis({
                    platform: selectedPlatform,
                    appInfo: selectedPlatform === 'google' ? googleAppInfo : appleAppInfo,
                    analyzedReviews
                  })}
                  disabled={isLoading}
                  className={`
                    px-6 py-2 rounded-xl text-white
                    bg-blue-500 hover:bg-blue-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    transition-all duration-300
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isLoading ? 'Kaydediliyor...' : 'Analizi Kaydet'}
                </button>
                <button
                  onClick={downloadExcel}
                  disabled={!analyzedReviews.length}
                  className={`
                    px-6 py-2 rounded-xl text-white
                    bg-green-500 hover:bg-green-600
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    transition-all duration-300
                    ${!analyzedReviews.length ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  Excel Olarak İndir
                </button>
              </div>

              {/* Uygulama Bilgileri */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-start gap-4">
                  {(googleAppInfo?.icon || appleAppInfo?.icon) && (
                    <img
                      src={selectedPlatform === 'google' ? googleAppInfo?.icon : appleAppInfo?.icon}
                      alt={selectedPlatform === 'google' ? googleAppInfo?.title : appleAppInfo?.title}
                      className="w-20 h-20 rounded-xl"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedPlatform === 'google' ? googleAppInfo?.title : appleAppInfo?.title || 'Uygulama Adı'}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center">
                        {renderStars(calculateAverageRating(analyzedReviews))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({analyzedReviews.length} değerlendirme)
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2 line-clamp-2">
                      {selectedPlatform === 'google' ? googleAppInfo?.description : appleAppInfo?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* İçgörüler */}
              {(googleAppInfo?.insights || appleAppInfo?.insights) && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Analiz Sonuçları</h3>
                  <div className="prose max-w-none">
                    {(selectedPlatform === 'google' ? googleAppInfo?.insights : appleAppInfo?.insights)?.split('\n').map((line, index) => (
                      <p key={index} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Ana içerik */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <SentimentDistributionChart data={statistics} />
                <CategoryDistributionChart categories={categories} />
                <SentimentScore analyzedReviews={analyzedReviews} />
                <WordCloud analyzedReviews={analyzedReviews} />
                <div className="lg:col-span-2">
                  <ReviewCountTrendChart analyzedReviews={analyzedReviews} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Kategori analizi yardımcı fonksiyonu
function analyzeCategories(reviews: AnalyzedReview[]): { [key: string]: number } {
  const categories = {
    'Müşteri Memnuniyeti': [
      // Olumlu ifadeler
      'süper', 'harika', 'mükemmel', 'muhteşem', 'çok iyi', 'başarılı', 'güzel', 'fevkalade',
      'enfes', 'kusursuz', 'şahane', 'efsane', 'memnun', 'teşekkür', 'bravo', 'tebrik',
      'beğendim', 'sevdim', 'tavsiye ederim', 'öneririm', 'tam not', 'başarılı', 'iyi iş',
      'güzel olmuş', 'iyi', 'hoş', 'keyifli', 'mutlu', 'sevindim', 'memnunum', 'çok güzel',
      'bayıldım', '👍', '❤️', '😊', '🙂', '♥️', 'süpersin', 'harikasın', 'perfect',
      // Olumsuz ifadeler
      'berbat', 'rezalet', 'kötü', 'berbat', 'felaket', 'korkunç', 'vasat', 'yetersiz',
      'başarısız', 'beğenmedim', 'sevmedim', 'pişman', 'tavsiye etmem', 'önermem', 'sıfır',
      'boşuna', 'zaman kaybı', 'hayal kırıklığı', 'memnun değilim', 'işe yaramaz',
      'berbat olmuş', 'çöp', 'kötü olmuş', 'facia', 'rezil', 'berbat', 'saçma',
      'beğenmedim', '👎', '😠', '😡', '🤬', '💩', 'worst', 'terrible'
    ],
    'Performans': ['yavaş', 'donma', 'kasma', 'gecikme', 'çökme', 'bug', 'hata'],
    'Kullanılabilirlik': ['kullanımı', 'arayüz', 'tasarım', 'menü', 'kolay', 'karmaşık'],
    'Özellikler': ['özellik', 'fonksiyon', 'güncelleme', 'yenilik'],
    'Güvenlik': ['güvenlik', 'gizlilik', 'şifre', 'hesap'],
    'Diğer': []
  };

  const categoryCounts: { [key: string]: number } = {};

  // Metni temizleyen yardımcı fonksiyon
  const cleanText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[.,!?;:'"]/g, ' ') // Noktalama işaretlerini boşluğa çevir
      .replace(/\s+/g, ' ')        // Birden fazla boşluğu teke indir
      .trim();
  };

  // Kelime sınırlarını kontrol eden yardımcı fonksiyon
  const containsWord = (text: string, word: string): boolean => {
    // Emoji kontrolü
    if (word.match(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{2600}-\u{26FF}]/u)) {
      return text.includes(word);
    }
    
    // Metni ve aranacak kelimeyi temizle
    const cleanedText = cleanText(text);
    const cleanedWord = cleanText(word);
    
    // Kelime sınırlarını kontrol et
    return cleanedText.split(' ').some(w => w === cleanedWord);
  };

  // Birden fazla kelimeden oluşan ifadeleri kontrol eden fonksiyon
  const containsPhrase = (text: string, phrase: string): boolean => {
    const cleanedText = cleanText(text);
    const cleanedPhrase = cleanText(phrase);
    return cleanedText.includes(cleanedPhrase);
  };

  reviews.forEach(review => {
    const text = review.text.toLowerCase();
    let foundCategory = false;

    // Önce Müşteri Memnuniyeti kategorisini kontrol et
    const customerSatisfactionKeywords = categories['Müşteri Memnuniyeti'];
    if (customerSatisfactionKeywords.some(keyword => {
      // Kelime veya emoji kontrolü
      if (keyword.match(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{2600}-\u{26FF}]/u)) {
        return text.includes(keyword);
      }
      // Çok kelimeli ifade kontrolü
      if (keyword.includes(' ')) {
        return containsPhrase(text, keyword);
      }
      // Tek kelime kontrolü
      return containsWord(text, keyword);
    })) {
      categoryCounts['Müşteri Memnuniyeti'] = (categoryCounts['Müşteri Memnuniyeti'] || 0) + 1;
      foundCategory = true;
    }

    // Diğer kategorileri kontrol et
    if (!foundCategory) {
      for (const [category, keywords] of Object.entries(categories)) {
        if (category === 'Müşteri Memnuniyeti') continue;
        
        if (keywords.some(keyword => {
          if (keyword.match(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{2600}-\u{26FF}]/u)) {
            return text.includes(keyword);
          }
          if (keyword.includes(' ')) {
            return containsPhrase(text, keyword);
          }
          return containsWord(text, keyword);
        })) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          foundCategory = true;
          break;
        }
      }
    }

    // Eğer hiçbir kategori bulunamadıysa ve yorum çok kısaysa Müşteri Memnuniyeti'ne ekle
    if (!foundCategory && cleanText(text).split(' ').length <= 3) {
      const positiveWords = ['iyi', 'güzel', 'süper', 'harika', '👍', '❤️', 'teşekkür'];
      const negativeWords = ['kötü', 'berbat', 'rezalet', '👎', '😠'];
      
      const hasPositive = positiveWords.some(word => containsWord(text, word));
      const hasNegative = negativeWords.some(word => containsWord(text, word));
      
      if (hasPositive || hasNegative) {
        categoryCounts['Müşteri Memnuniyeti'] = (categoryCounts['Müşteri Memnuniyeti'] || 0) + 1;
        foundCategory = true;
      }
    }

    // Hala hiçbir kategori bulunamadıysa Diğer'e ekle
    if (!foundCategory) {
      categoryCounts['Diğer'] = (categoryCounts['Diğer'] || 0) + 1;
    }
  });

  return categoryCounts;
} 