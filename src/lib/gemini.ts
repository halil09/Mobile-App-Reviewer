import { GoogleGenerativeAI } from '@google/generative-ai';

interface Review {
  sentiment: string;
  text: string;
  date?: string;
}

interface GooglePlayReview extends Review {
  source: 'google-play';
}

interface AppStoreReview extends Review {
  source: 'app-store';
}

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY çevresel değişkeni tanımlanmamış');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Yeniden deneme fonksiyonu
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`Deneme ${attempt}/${maxAttempts} başarısız oldu. ${error.message}`);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
}

// Yedek içgörü metni oluşturma fonksiyonu
function generateFallbackInsights(data: any): string {
  const { statistics = { total: 0, positive: 0, neutral: 0, negative: 0 } } = data;
  const totalReviews = statistics.total || 0;
  
  if (totalReviews === 0) {
    return "Henüz yeterli veri bulunmamaktadır. Daha detaylı analiz için daha fazla kullanıcı yorumu gereklidir.";
  }

  const positivePercentage = ((statistics.positive / totalReviews) * 100).toFixed(1);
  const negativePercentage = ((statistics.negative / totalReviews) * 100).toFixed(1);

  return `
    Genel Değerlendirme:
    Uygulama için toplam ${totalReviews} yorum analiz edilmiştir. Yorumların %${positivePercentage}'i olumlu, %${negativePercentage}'i olumsuz olarak değerlendirilmiştir.

    Öneriler:
    1. Kullanıcı geri bildirimlerini düzenli olarak takip edin
    2. Olumsuz yorumlara hızlı yanıt verin
    3. Kullanıcı deneyimini sürekli iyileştirin
  `;
}

export async function generateInsights(analysisData: any) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const analysisText = formatAnalysisData(analysisData);

    const prompt = `
      Aşağıdaki uygulama analiz verilerine dayanarak kısa ve öz bir içgörü raporu hazırla.
      
      Raporda sadece şu noktalara değin:
      1. Genel memnuniyet durumu (1-2 cümle)
      2. Öne çıkan olumlu ve olumsuz noktalar (madde madde, kısa)
      3. Öncelikli iyileştirme önerileri (en fazla 3 madde)
      
      Raporu Türkçe olarak yaz ve 150 kelimeyi geçme.
      
      Analiz Verileri:
      ${analysisText}
    `;

    // Yeniden deneme mantığı ile API çağrısı
    const result = await retryOperation(async () => {
      const generationResult = await model.generateContent(prompt);
      return generationResult.response;
    });

    return result.text();
  } catch (error) {
    console.error('İçgörü oluşturma hatası:', error);
    
    // API hatası durumunda yedek içgörü metnini döndür
    return generateFallbackInsights(analysisData);
  }
}

function formatAnalysisData(data: any) {
  const {
    appName = 'Bilinmeyen Uygulama',
    statistics = {
      total: 0,
      positive: 0,
      neutral: 0,
      negative: 0
    },
    categories = {},
    ratings = {},
    sentimentTrend = [],
    reviews = []
  } = data || {};

  const totalReviews = statistics.total || 0;
  const categoryAnalysis = analyzeCategories(reviews);
  
  return `
    Uygulama: ${appName}

    Genel İstatistikler:
    - Toplam Yorum Sayısı: ${totalReviews}
    - Olumlu Yorumlar: ${statistics.positive} (${totalReviews > 0 ? ((statistics.positive / totalReviews) * 100).toFixed(1) : 0}%)
    - Nötr Yorumlar: ${statistics.neutral} (${totalReviews > 0 ? ((statistics.neutral / totalReviews) * 100).toFixed(1) : 0}%)
    - Olumsuz Yorumlar: ${statistics.negative} (${totalReviews > 0 ? ((statistics.negative / totalReviews) * 100).toFixed(1) : 0}%)

    Kategori Dağılımı:
    ${Object.entries(categoryAnalysis)
      .map(([category, count]) => `- ${category}: ${count} yorum (${totalReviews > 0 ? ((count / totalReviews) * 100).toFixed(1) : 0}%)`)
      .join('\n')}

    Puan Dağılımı:
    ${Object.entries(ratings || {})
      .map(([rating, count]) => `- ${rating} Yıldız: ${count} yorum (${totalReviews > 0 ? ((Number(count) / totalReviews) * 100).toFixed(1) : 0}%)`)
      .join('\n')}

    Son Yorumlardan Örnekler:
    ${(sentimentTrend || []).slice(0, 5)
      .map((review: Review) => `- ${review.sentiment.toUpperCase()}: "${review.text}"`)
      .join('\n')}
  `;
}

function analyzeCategories(reviews: (GooglePlayReview | AppStoreReview)[]): { [key: string]: number } {
  const categories = {
    'Performans': [
      'yavaş', 'donma', 'kasma', 'gecikme', 'lag', 'hızlı', 'akıcı', 'stabil', 'performans', 
      'çökme', 'bug', 'hata', 'optimizasyon', 'yüksek FPS', 'takılma', 'yüklenme süresi', 
      'frame drop', 'fps düşüşü', 'pil tüketimi', 'ısınma', 'yükleme süresi', 'sistem kullanımı', 
      'RAM tüketimi', 'CPU kullanımı'
    ],
    
    'Kullanılabilirlik': [
      'kullanımı', 'arayüz', 'UI', 'UX', 'tasarım', 'menü', 'düzen', 'karmaşık', 'basit', 
      'kolay', 'sezgisel', 'kullanıcı deneyimi', 'anlaşılır', 'kullanışlı', 'karışık', 
      'erişilebilirlik', 'görsel tasarım', 'tema', 'dark mode', 'renkler', 'buton', 'navigasyon', 
      'scroll', 'font boyutu', 'okunabilirlik', 'dokunmatik hassasiyeti', 'gesture kontrolü', 
      'ekran boyutuna uyum'
    ],
    
    'Özellikler & Güncellemeler': [
      'özellik', 'fonksiyon', 'seçenek', 'yenilik', 'güncelleme', 'beta', 'yeni sürüm', 'mod', 
      'ekstra', 'eksik', 'ekleme', 'iyileştirme', 'özelleştirme', 'widget', 'entegre', 'plugin', 
      'modül', 'feedback', 'özellik kaldırıldı', 'geri getirilmesi gereken özellik', 'yeni araçlar', 
      'kullanıcı talepleri', 'AI entegrasyonu', 'offline kullanım'
    ],
    
    'Güvenlik & Gizlilik': [
      'güvenlik', 'gizlilik', 'şifre', 'hesap', 'doğrulama', 'hata', 'giriş', 'kimlik', 
      'data breach', 'hacklenme', 'açık', 'güvenlik açığı', 'kişisel veri', 'kimlik avı', 
      'yetkilendirme', 'token', 'biometrik', 'çift aşamalı doğrulama', 'OTP', 'hesap çalındı', 
      'çerez politikası', 'VPN uyumluluğu', 'şifreleme', 'anonimlik', 'izinler', 'konum erişimi', 
      'arka planda izleme'
    ],
    
    'Teknik Sorunlar': [
      'bağlantı', 'internet', 'wifi', 'mobil veri', 'sunucu', 'hata', 'çöküyor', 'açılmıyor', 
      'bağlanmıyor', 'ağ hatası', 'server error', 'timeout', 'yükleme hatası', '403', '404', 
      '500', 'beklenmeyen hata', 'yanıt vermiyor', 'bağlantı koptu', 'ping', 'düşük hız', 
      'server down', 'VPN ile çalışmıyor', 'DNS hatası', 'sistem erişimi', 'offline çalışmıyor', 
      'uygulama çakışması', 'arka planda çalışmıyor'
    ],
    
    'Müşteri Hizmetleri': [
      'destek', 'yardım', 'iletişim', 'çözüm', 'yanıt', 'şikayet', 'cevap alamıyorum', 
      'geç dönüş', 'destek ekibi', 'canlı destek', 'ticket', 'e-posta', 'müşteri ilişkileri', 
      'şikayet var', 'geri bildirim', 'moderasyon', 'destek sistemi', 'otomatik yanıt', 
      'canlı sohbet', 'sosyal medya desteği', 'topluluk yönetimi', 'hataların raporlanması'
    ],
    
    'Fiyatlandırma & Abonelik': [
      'ücret', 'fiyat', 'pahalı', 'ucuz', 'ödeme', 'satın alma', 'abonelik', 'fiyat politikası', 
      'free trial', 'premium', 'reklam kaldırma', 'iade', 'parayı hak etmiyor', 'tahsilat', 
      'yanıltıcı fiyatlandırma', 'faturalandırma', 'ödeme hatası', 'tek seferlik ödeme', 
      'abonelik iptali', 'zorunlu premium', 'gizli ücretler', 'ücretsiz özelliklerin kaldırılması', 
      'ödeme entegrasyonu'
    ],
    
    'İçerik & Reklamlar': [
      'içerik', 'reklam', 'bilgi', 'veri', 'paylaşım', 'spam', 'reklam çok fazla', 
      'rahatsız edici reklam', 'reklam kaldırma', 'premium içerik', 'kalitesiz içerik', 
      'eksik içerik', 'dolandırıcılık', 'yanıltıcı bilgi', 'clickbait', 'paylaşım hatası', 
      'yüklenmiyor', 'içerik engeli', 'copyright', 'lisans', 'çalıntı içerik', 
      'moderasyon eksikliği', 'kullanıcı oluşturduğu içerikler', 'reklam süresi', 
      'şok edici içerik', 'şiddet içeriyor', 'çocuk dostu değil', 'erişim engeli'
    ]
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