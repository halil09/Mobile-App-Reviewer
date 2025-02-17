import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Analysis from '@/models/Analysis';

export async function POST(request: Request) {
  try {
    await connectDB();

    const analysisData = await request.json();
    const analysis = new Analysis(analysisData);
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