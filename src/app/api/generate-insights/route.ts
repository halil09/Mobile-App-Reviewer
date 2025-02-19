import { NextResponse } from 'next/server';
import { generateInsights } from '@/lib/gemini';

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

export async function POST(request: Request) {
  let requestData: AnalysisData;
  
  try {
    requestData = await request.json();

    if (!requestData) {
      return NextResponse.json(
        { error: 'Analiz verisi gerekli' },
        { status: 400 }
      );
    }

    // Gemini ile içgörü metni oluştur
    const insights = await generateInsights(requestData);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('İçgörü oluşturma hatası:', error);
    
    // Basit istatistikler oluştur
    const { statistics = { total: 0, positive: 0, neutral: 0, negative: 0 } } = requestData || {};
    const totalReviews = statistics.total || 0;
    
    let fallbackInsights = '';
    
    if (totalReviews === 0) {
      fallbackInsights = "Henüz yeterli veri bulunmamaktadır. Daha detaylı analiz için daha fazla kullanıcı yorumu gereklidir.";
    } else {
      const positivePercentage = ((statistics.positive / totalReviews) * 100).toFixed(1);
      const negativePercentage = ((statistics.negative / totalReviews) * 100).toFixed(1);
      
      fallbackInsights = `
        Genel Değerlendirme:
        Uygulama için toplam ${totalReviews} yorum analiz edilmiştir. 
        Yorumların %${positivePercentage}'i olumlu, %${negativePercentage}'i olumsuz olarak değerlendirilmiştir.

        Öneriler:
        1. Kullanıcı geri bildirimlerini düzenli olarak takip edin
        2. Olumsuz yorumlara hızlı yanıt verin
        3. Kullanıcı deneyimini sürekli iyileştirin
      `;
    }

    return NextResponse.json({ insights: fallbackInsights });
  }
} 