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
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
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

// Gemini API ile kategori sınıflandırması
async function classifyWithGemini(text: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Aşağıdaki yorumu analiz et ve en uygun ana kategoriyi seç.
      
      Kategoriler:
      1. Müşteri Memnuniyeti: Genel memnuniyet, beğeni veya şikayet ifadeleri
      2. Performans: Hız, stabilite, çökme, donma gibi teknik performans konuları
      3. Kullanılabilirlik: Arayüz, kullanım kolaylığı, tasarım
      4. Özellikler & Güncellemeler: Yeni özellikler, güncellemeler, eksik özellikler
      5. Güvenlik & Gizlilik: Güvenlik, gizlilik, hesap sorunları
      6. Teknik Sorunlar: Bağlantı, sunucu, hata mesajları
      7. Müşteri Hizmetleri: Destek, iletişim, yanıt süreleri
      8. Fiyatlandırma & Abonelik: Ücretler, ödemeler, abonelikler
      9. İçerik & Reklamlar: İçerik kalitesi, reklamlar

      Yorum: "${text}"

      Sadece kategori adını yaz, başka bir şey yazma.
    `;

    const result = await retryOperation(async () => {
      const generationResult = await model.generateContent(prompt);
      return generationResult.response;
    });

    const category = result.text().trim();
    
    // Geçerli bir kategori mi kontrol et
    const validCategories = [
      'Müşteri Memnuniyeti',
      'Performans',
      'Kullanılabilirlik',
      'Özellikler & Güncellemeler',
      'Güvenlik & Gizlilik',
      'Teknik Sorunlar',
      'Müşteri Hizmetleri',
      'Fiyatlandırma & Abonelik',
      'İçerik & Reklamlar'
    ];

    return validCategories.includes(category) ? category : null;
  } catch (error) {
    return null;
  }
}

// Mevcut analyzeCategories fonksiyonunu güncelle
async function analyzeCategories(reviews: (GooglePlayReview | AppStoreReview)[]): Promise<{ [key: string]: number }> {
  const categoryCounts: { [key: string]: number } = {};

  for (const review of reviews) {
    try {
      const geminiCategory = await classifyWithGemini(review.text);
      
      if (geminiCategory) {
        categoryCounts[geminiCategory] = (categoryCounts[geminiCategory] || 0) + 1;
        continue;
      }
    } catch {
      // Sessizce devam et ve anahtar kelime bazlı sisteme geç
    }

    // Gemini başarısız olursa anahtar kelime bazlı sistemi kullan
    const text = review.text.toLowerCase();
    let foundCategory = false;

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

    // Önce Müşteri Memnuniyeti kategorisini kontrol et
    const customerSatisfactionKeywords = ['süper', 'harika', 'mükemmel', 'muhteşem', 'çok iyi', 'başarılı', 'güzel', 'fevkalade',
      'enfes', 'kusursuz', 'şahane', 'efsane', 'memnun', 'teşekkür', 'bravo', 'tebrik',
      'beğendim', 'sevdim', 'tavsiye ederim', 'öneririm', 'tam not', 'başarılı', 'iyi iş',
      'güzel olmuş', 'iyi', 'hoş', 'keyifli', 'mutlu', 'sevindim', 'memnunum', 'çok güzel',
      'bayıldım', '👍', '❤️', '😊', '🙂', '♥️', 'süpersin', 'harikasın', 'perfect',
      'berbat', 'rezalet', 'kötü', 'berbat', 'felaket', 'korkunç', 'vasat', 'yetersiz',
      'başarısız', 'beğenmedim', 'sevmedim', 'pişman', 'tavsiye etmem', 'önermem', 'sıfır',
      'boşuna', 'zaman kaybı', 'hayal kırıklığı', 'memnun değilim', 'işe yaramaz',
      'berbat olmuş', 'çöp', 'kötü olmuş', 'facia', 'rezil', 'berbat', 'saçma',
      'beğenmedim', '👎', '😠', '😡', '🤬', '💩', 'worst', 'terrible'];
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
  }

  return categoryCounts;
} 