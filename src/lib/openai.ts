import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalysisData {
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
  sentimentTrend: Array<{
    date: string;
    text: string;
    sentiment: string;
  }>;
}

export async function generateInsightsWithOpenAI(analysisData: AnalysisData): Promise<string> {
  try {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Sen bir uygulama analisti olarak çalışıyorsun. Kullanıcı yorumlarını analiz edip içgörüler sunuyorsun."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0]?.message?.content || generateFallbackInsights(analysisData);
  } catch (error) {
    console.error('OpenAI içgörü oluşturma hatası:', error);
    return generateFallbackInsights(analysisData);
  }
}

function formatAnalysisData(data: AnalysisData): string {
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
    sentimentTrend = []
  } = data;

  const totalReviews = statistics.total || 0;
  
  return `
    Uygulama: ${appName}

    Genel İstatistikler:
    - Toplam Yorum Sayısı: ${totalReviews}
    - Olumlu Yorumlar: ${statistics.positive} (${totalReviews > 0 ? ((statistics.positive / totalReviews) * 100).toFixed(1) : 0}%)
    - Nötr Yorumlar: ${statistics.neutral} (${totalReviews > 0 ? ((statistics.neutral / totalReviews) * 100).toFixed(1) : 0}%)
    - Olumsuz Yorumlar: ${statistics.negative} (${totalReviews > 0 ? ((statistics.negative / totalReviews) * 100).toFixed(1) : 0}%)

    Kategori Dağılımı:
    ${Object.entries(categories)
      .map(([category, count]) => `- ${category}: ${count} yorum (${totalReviews > 0 ? ((Number(count) / totalReviews) * 100).toFixed(1) : 0}%)`)
      .join('\n')}

    Puan Dağılımı:
    ${Object.entries(ratings)
      .map(([rating, count]) => `- ${rating} Yıldız: ${count} yorum (${totalReviews > 0 ? ((Number(count) / totalReviews) * 100).toFixed(1) : 0}%)`)
      .join('\n')}

    Son Yorumlardan Örnekler:
    ${sentimentTrend.slice(0, 5)
      .map(review => `- ${review.sentiment.toUpperCase()}: "${review.text}"`)
      .join('\n')}
  `;
}

function generateFallbackInsights(data: AnalysisData): string {
  const { statistics = { total: 0, positive: 0, neutral: 0, negative: 0 } } = data;
  const totalReviews = statistics.total || 0;
  
  if (totalReviews === 0) {
    return "Henüz yeterli veri bulunmamaktadır. Daha detaylı analiz için daha fazla kullanıcı yorumu gereklidir.";
  }

  const positivePercentage = ((statistics.positive / totalReviews) * 100).toFixed(1);
  const negativePercentage = ((statistics.negative / totalReviews) * 100).toFixed(1);

  return `
    Genel Değerlendirme:
    Uygulama için toplam ${totalReviews} yorum analiz edilmiştir. 
    Yorumların %${positivePercentage}'i olumlu, %${negativePercentage}'i olumsuz olarak değerlendirilmiştir.

    Öneriler:
    1. Kullanıcı geri bildirimlerini düzenli olarak takip edin
    2. Olumsuz yorumlara hızlı yanıt verin
    3. Kullanıcı deneyimini sürekli iyileştirin
  `;
} 