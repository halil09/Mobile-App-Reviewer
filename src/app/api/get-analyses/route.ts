import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Analysis from '@/models/Analysis';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
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

    // Sadece kullanıcının kendi analizlerini getir
    const analyses = await Analysis.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .lean();

    // Dönen verileri kontrol et
    console.log('MongoDB\'den alınan analizler:', 
      analyses.map(analysis => ({
        id: analysis._id,
        appInfo: analysis.appInfo,
        reviewCount: analysis.analyzedReviews?.length,
        sampleReview: analysis.analyzedReviews?.[0],
        statistics: analysis.statistics
      }))
    );

    // Veri yapısını kontrol et
    analyses.forEach((analysis, index) => {
      if (!analysis.analyzedReviews || !Array.isArray(analysis.analyzedReviews)) {
        console.error(`Hatalı veri yapısı: Analiz ${index + 1}`, analysis);
      }
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Analizleri getirme hatası:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Geçersiz oturum' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analizler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 