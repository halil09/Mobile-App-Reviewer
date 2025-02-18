import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Analysis from '@/models/Analysis';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
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

    const analysisData = await request.json();
    
    // Analiz verisine kullanıcı ID'sini ekle
    const analysis = new Analysis({
      ...analysisData,
      userId: decoded.userId
    });
    
    await analysis.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Analiz başarıyla kaydedildi',
      analysisId: analysis._id 
    });
  } catch (error) {
    console.error('Analiz kaydetme hatası:', error);
    return NextResponse.json(
      { error: 'Analiz kaydedilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 