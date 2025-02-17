import { NextResponse } from 'next/server';
import { TextAnalyticsClient, AzureKeyCredential } from "@azure/ai-text-analytics";
import * as gplay from 'google-play-scraper';

const client = new TextAnalyticsClient(
  process.env.AZURE_TEXT_ANALYTICS_ENDPOINT || "",
  new AzureKeyCredential(process.env.AZURE_TEXT_ANALYTICS_KEY || "")
);

async function fetchGooglePlayData(appId: string) {
  try {
    // Uygulama bilgilerini çek
    const appInfo = await gplay.app({
      appId: appId,
      lang: 'tr',
      country: 'tr'
    });

    // Yorumları çek
    const reviewsResult = await gplay.reviews({
      appId: appId,
      lang: 'tr',
      country: 'tr',
      sort: gplay.sort.HELPFULNESS,
      num: 50 // Her uygulama için 50 yorum
    });

    return {
      appName: appInfo.title,
      reviews: reviewsResult.data
    };
  } catch (error) {
    console.error('Veri çekme hatası:', error);
    throw error;
  }
}

async function fetchAppStoreData(appId: string) {
  try {
    const response = await fetch(
      `https://itunes.apple.com/tr/rss/customerreviews/id=${appId}/sortBy=mostRecent/page=1/limit=50/json`
    );

    if (!response.ok) {
      throw new Error("iTunes API'den veri çekilemedi");
    }

    const data = await response.json();
    const entries = data.feed?.entry || [];

    // App adını al
    const appResponse = await fetch(
      `https://itunes.apple.com/lookup?id=${appId}&country=tr`
    );
    const appData = await appResponse.json();
    const appName = appData.results[0]?.trackName || 'Bilinmeyen Uygulama';

    // Yorumları dönüştür
    const reviews = entries.map((entry: any) => ({
      id: entry.id?.label || '',
      userName: entry.author?.name?.label || 'Anonim',
      text: entry.content?.label || '',
      score: parseInt(entry['im:rating']?.label || '0'),
      date: new Date(entry.updated?.label || '').toISOString()
    }));

    return {
      appName,
      reviews
    };
  } catch (error) {
    console.error('App Store veri çekme hatası:', error);
    throw error;
  }
}

function getAppIdFromUrl(url: string, platform: 'google' | 'apple') {
  if (platform === 'google') {
    const match = url.match(/id=([^&]+)/);
    return match ? match[1] : null;
  } else {
    const match = url.match(/id(\d+)/);
    return match ? match[1] : null;
  }
}

function analyzeCategories(reviews: any[]) {
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

  const categoryCounts: { [key: string]: number } = {};

  reviews.forEach(review => {
    const text = review.text.toLowerCase();
    let foundCategory = false;

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        foundCategory = true;
      }
    }

    if (!foundCategory) {
      categoryCounts['Diğer'] = (categoryCounts['Diğer'] || 0) + 1;
    }
  });

  return categoryCounts;
}

function analyzeRatings(reviews: any[]) {
  const ratings: { [key: string]: number } = {
    '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
  };

  reviews.forEach(review => {
    ratings[review.score.toString()] = (ratings[review.score.toString()] || 0) + 1;
  });

  return ratings;
}

// Diziyi belirtilen boyutta parçalara ayıran yardımcı fonksiyon ekleyelim
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function POST(request: Request) {
  try {
    const { platform, mainAppUrl, competitorUrls } = await request.json();
    const allUrls = [mainAppUrl, ...competitorUrls];
    const analyses = [];

    for (const url of allUrls) {
      const appId = getAppIdFromUrl(url, platform);
      
      if (!appId) {
        throw new Error(`Geçersiz URL formatı: ${url}`);
      }

      // Platform'a göre veri çek
      const appData = platform === 'google' 
        ? await fetchGooglePlayData(appId)
        : await fetchAppStoreData(appId);

      // Yorumları 10'arlı gruplara ayır
      const reviewChunks = chunkArray(appData.reviews, 10);
      let allSentimentResults = [];

      // Her grubu ayrı ayrı analiz et
      for (const chunk of reviewChunks) {
        const documents = chunk.map(review => ({
          text: review.text,
          id: review.id,
          language: "tr"
        }));

        const chunkResults = await client.analyzeSentiment(documents, { language: "tr" });
        allSentimentResults = [...allSentimentResults, ...chunkResults];
      }

      // İstatistikleri hesapla
      const statistics = {
        total: allSentimentResults.length,
        positive: allSentimentResults.filter(r => r.sentiment === 'positive').length,
        neutral: allSentimentResults.filter(r => r.sentiment === 'neutral').length,
        negative: allSentimentResults.filter(r => r.sentiment === 'negative').length
      };

      // Kategori ve puan analizleri
      const categories = analyzeCategories(appData.reviews);
      const ratings = analyzeRatings(appData.reviews);

      // Duygu trendi ve yorum detayları
      const sentimentTrend = appData.reviews.map((review: any, index: number) => ({
        date: new Date(review.date).toLocaleDateString('tr-TR'),
        text: review.text,
        sentiment: allSentimentResults[index]?.sentiment || 'neutral'
      }));

      analyses.push({
        appName: appData.appName,
        statistics,
        categories,
        ratings,
        sentimentTrend
      });
    }

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Rakip analizi hatası:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analiz yapılırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 