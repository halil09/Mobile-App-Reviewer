import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Analysis from '@/models/Analysis';

export async function GET() {
  try {
    await connectDB();

    const analyses = await Analysis.find({})
      .select('platform appInfo.title statistics createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

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