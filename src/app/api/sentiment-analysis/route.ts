import { TextAnalyticsClient, AzureKeyCredential } from "@azure/ai-text-analytics";
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const client = new TextAnalyticsClient(
  process.env.AZURE_TEXT_ANALYTICS_ENDPOINT || "",
  new AzureKeyCredential(process.env.AZURE_TEXT_ANALYTICS_KEY || "")
);

// Diziyi belirtilen boyutta parçalara ayıran yardımcı fonksiyon
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function POST(request: Request) {
  try {
    const { reviews } = await request.json();

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json(
        { error: "Geçerli yorum dizisi gönderilmedi" },
        { status: 400 }
      );
    }

    // Yorumları 10'arlı gruplara ayır
    const reviewChunks = chunkArray(reviews, 10);
    let allAnalyzedReviews = [];

    // Her grubu ayrı ayrı analiz et
    for (const chunk of reviewChunks) {
      const documents = chunk.map((review: any) => ({
        text: review.text,
        id: review.id,
        language: "tr"
      }));

      const results = await client.analyzeSentiment(documents, { language: "tr" });

      // Sonuçları formatla ve ana diziye ekle
      const analyzedChunk = results.map((result, index) => {
        if (result.error) {
          return {
            ...chunk[index],
            sentiment: 'neutral',
            confidenceScores: {
              positive: 0,
              neutral: 1,
              negative: 0
            }
          };
        }

        return {
          ...chunk[index],
          sentiment: result.sentiment,
          confidenceScores: result.confidenceScores
        };
      });

      allAnalyzedReviews = [...allAnalyzedReviews, ...analyzedChunk];
    }

    // İstatistikleri hesapla
    const statistics = {
      total: allAnalyzedReviews.length,
      positive: allAnalyzedReviews.filter(r => r.sentiment === 'positive').length,
      neutral: allAnalyzedReviews.filter(r => r.sentiment === 'neutral').length,
      negative: allAnalyzedReviews.filter(r => r.sentiment === 'negative').length,
    };

    return NextResponse.json({
      reviews: allAnalyzedReviews,
      statistics
    });
  } catch (error) {
    console.error('Duygu analizi hatası:', error);
    return NextResponse.json(
      { error: "Duygu analizi yapılırken bir hata oluştu" },
      { status: 500 }
    );
  }
} 