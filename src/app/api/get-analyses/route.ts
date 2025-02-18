import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Analysis from '@/models/Analysis';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  try {
    await connectDB();

    // Token'ı al ve doğrula
    const token = cookies().get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    // Token'dan kullanıcı bilgilerini çıkar
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Sadece giriş yapmış kullanıcının son 5 analizini getir
    const analyses = await Analysis.find({ userId: decoded.userId })
      .select('platform appInfo.title statistics createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({ 
      success: true, 
      analyses 
    });
  } catch (error) {
    console.error('Analizleri getirme hatası:', error);
    return NextResponse.json(
      { error: 'Analizler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 