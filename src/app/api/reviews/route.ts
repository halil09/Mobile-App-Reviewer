import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { appId } = await request.json();

    if (!appId) {
      return NextResponse.json(
        { error: "Geçerli bir App Store URLsi giriniz" },
        { status: 400 }
      );
    }

    // iTunes API'sini kullanarak yorumları çekelim (20 yorum limiti ile)
    const response = await fetch(
      `https://itunes.apple.com/tr/rss/customerreviews/id=${appId}/sortBy=mostRecent/page=1/limit=20/json`
    );

    if (!response.ok) {
      throw new Error("iTunes API'den veri çekilemedi");
    }

    const data = await response.json();
    const entries = data.feed?.entry || [];

    // Tüm yorumları dönüştürelim
    const reviews = entries.map((entry: any) => ({
      id: entry.id?.label || '',
      userName: entry.author?.name?.label || 'Anonim',
      title: entry.title?.label || '',
      text: entry.content?.label || '',
      score: parseInt(entry['im:rating']?.label || '0'),
      date: new Date(entry.updated?.label || '').toISOString()
    }));

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('App Store yorumları çekilirken hata:', error);
    return NextResponse.json(
      { error: "Yorumlar çekilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 