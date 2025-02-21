import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Analysis from '@/models/Analysis';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Sentiment değerini doğrulama ve düzeltme fonksiyonu
function validateSentiment(sentiment: string): 'positive' | 'neutral' | 'negative' | 'mixed' {
  const validSentiments = ['positive', 'neutral', 'negative', 'mixed'];
  const normalizedSentiment = sentiment.toLowerCase();
  
  if (validSentiments.includes(normalizedSentiment)) {
    return normalizedSentiment as 'positive' | 'neutral' | 'negative' | 'mixed';
  }
  
  // Eğer geçersiz bir değer varsa 'neutral' olarak ayarla
  console.warn(`Geçersiz sentiment değeri düzeltiliyor: ${sentiment} -> neutral`);
  return 'neutral';
}

export async function POST(request: Request) {
  try {
    await connectDB();

    // Auth token'ı al
    const token = cookies().get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    // Token'ı doğrula ve kullanıcı bilgilerini al
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const { platform, appInfo, analyzedReviews, statistics } = await request.json();

    // Gelen verileri kontrol et
    console.log('Kaydedilecek veriler:', {
      platform,
      appInfo: JSON.stringify(appInfo, null, 2),
      analyzedReviewsSample: analyzedReviews.slice(0, 2),
      statistics
    });

    // Veri yapısını doğrula
    if (!Array.isArray(analyzedReviews)) {
      throw new Error('analyzedReviews bir dizi olmalıdır');
    }

    // Her yorumu doğrula ve düzelt
    const validatedReviews = analyzedReviews.map((review: any) => {
      if (!review.text || !review.sentiment || !review.date) {
        throw new Error('Eksik alanlar: text, sentiment veya date');
      }

      return {
        ...review,
        sentiment: validateSentiment(review.sentiment)
      };
    });

    const analysis = await Analysis.create({
      userId: decoded.userId,
      platform,
      appInfo,
      analyzedReviews: validatedReviews,
      statistics,
      createdAt: new Date()
    });

    // Kaydedilen veriyi kontrol et
    console.log('MongoDB\'ye kaydedilen analiz:', JSON.stringify(analysis.toObject(), null, 2));

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Analiz kaydetme hatası:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Geçersiz oturum' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analiz kaydedilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 