import { TextAnalyticsClient, AzureKeyCredential, TextDocumentInput } from "@azure/ai-text-analytics";
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface Review {
  id: string;
  text: string;
}

interface AnalyzedReview extends Review {
  sentiment: string;
  confidenceScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

// Azure kimlik bilgilerini kontrol et
const AZURE_ENDPOINT = process.env.AZURE_TEXT_ANALYTICS_ENDPOINT;
const AZURE_KEY = process.env.AZURE_TEXT_ANALYTICS_KEY;

if (!AZURE_ENDPOINT || !AZURE_KEY) {
  console.error('Azure Text Analytics kimlik bilgileri eksik');
}

const client = new TextAnalyticsClient(
  AZURE_ENDPOINT || "",
  new AzureKeyCredential(AZURE_KEY || "")
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
    // Azure kimlik bilgilerini kontrol et
    if (!AZURE_ENDPOINT || !AZURE_KEY) {
      throw new Error('Azure Text Analytics kimlik bilgileri eksik');
    }

    const { reviews } = await request.json();

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json(
        { error: "Geçerli yorum dizisi gönderilmedi" },
        { status: 400 }
      );
    }

    // Yorumları filtrele ve temizle
    const validReviews = reviews.filter(review => 
      review && 
      typeof review.text === 'string' && 
      review.text.trim().length > 0
    );

    if (validReviews.length === 0) {
      return NextResponse.json(
        { error: "Analiz edilebilecek geçerli yorum bulunamadı" },
        { status: 400 }
      );
    }

    // Yorumları 10'arlı gruplara ayır
    const reviewChunks = chunkArray(validReviews, 10);
    let allAnalyzedReviews: AnalyzedReview[] = [];
    let failedAnalyses = 0;

    // Her grubu ayrı ayrı analiz et
    for (const chunk of reviewChunks) {
      try {
        const documents: TextDocumentInput[] = chunk.map((review: Review) => ({
          text: review.text.trim(),
          id: review.id
        }));

        const results = await client.analyzeSentiment(documents);

        // Sonuçları formatla ve ana diziye ekle
        const analyzedChunk = results.map((result, index) => {
          if (result.error) {
            failedAnalyses++;
            console.warn(`Yorum analizi başarısız (ID: ${chunk[index].id}):`, result.error);
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
      } catch (error) {
        console.error('Grup analizi hatası:', error);
        failedAnalyses += chunk.length;
        
        // Hata durumunda nötr sentiment ile devam et
        const fallbackChunk = chunk.map(review => ({
          ...review,
          sentiment: 'neutral',
          confidenceScores: {
            positive: 0,
            neutral: 1,
            negative: 0
          }
        }));
        
        allAnalyzedReviews = [...allAnalyzedReviews, ...fallbackChunk];
      }
    }

    // İstatistikleri hesapla
    const statistics = {
      total: allAnalyzedReviews.length,
      positive: allAnalyzedReviews.filter(r => r.sentiment === 'positive').length,
      neutral: allAnalyzedReviews.filter(r => r.sentiment === 'neutral').length,
      negative: allAnalyzedReviews.filter(r => r.sentiment === 'negative').length,
      failedAnalyses
    };

    // Eğer tüm analizler başarısız olduysa hata döndür
    if (failedAnalyses === allAnalyzedReviews.length) {
      throw new Error('Hiçbir yorum analiz edilemedi');
    }

    return NextResponse.json({
      reviews: allAnalyzedReviews,
      statistics,
      warning: failedAnalyses > 0 ? `${failedAnalyses} yorum analiz edilemedi` : undefined
    });
  } catch (error) {
    console.error('Duygu analizi hatası:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Duygu analizi yapılırken bir hata oluştu",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 