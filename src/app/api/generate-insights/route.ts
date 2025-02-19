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
  try {
    const requestData = await request.json();

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
    const fallbackStats = {
      total: 0,
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    let fallbackInsights = "Henüz yeterli veri bulunmamaktadır. Daha detaylı analiz için daha fazla kullanıcı yorumu gereklidir.";

    return NextResponse.json({ insights: fallbackInsights });
  }
} 