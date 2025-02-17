import { NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function fetchGooglePlayData(appId: string) {
  try {
    // Uygulama bilgilerini çek
    const appInfo = await gplay.app({
      appId: appId,
      lang: 'tr',
      country: 'tr'
    });

    // Yorumları çek
    const reviewsResult = await gplay.reviews({
      appId: appId,
      lang: 'tr',
      country: 'tr',
      sort: gplay.sort.HELPFULNESS,
      num: 50 // 50 yorum çek
    });

    // Yorumları formatla
    const reviews = reviewsResult.data.map(review => ({
      id: review.id || Math.random().toString(),
      userName: review.userName || 'Anonim Kullanıcı',
      title: review.title || '',
      text: review.text || '',
      score: review.score || 0,
      date: new Date(review.date || Date.now()).toISOString(),
      thumbsUp: review.thumbsUp || 0,
      replyDate: review.replyDate || null,
      replyText: review.replyText || null
    }));

    return {
      appInfo: {
        title: appInfo.title,
        description: appInfo.summary,
        score: appInfo.score,
        ratings: appInfo.ratings,
        reviews: appInfo.reviews,
        currentVersion: appInfo.version,
        developer: appInfo.developer,
        icon: appInfo.icon
      },
      reviews
    };
  } catch (error) {
    console.error('Veri çekme hatası:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { appId } = await request.json();

    if (!appId) {
      return NextResponse.json(
        { error: "Geçerli bir Google Play Store URLsi giriniz" },
        { status: 400 }
      );
    }

    try {
      const data = await fetchGooglePlayData(appId);
      return NextResponse.json(data);
    } catch (scrapeError) {
      console.error('Scraping error:', scrapeError);
      
      // Hata durumunda örnek veriler döndürelim
      return NextResponse.json({ 
        reviews: Array.from({ length: 10 }, (_, index) => ({
          id: `review-${index + 1}`,
          userName: `Kullanıcı ${index + 1}`,
          title: '',
          text: `Google Play Store'dan veri çekilemedi. Lütfen daha sonra tekrar deneyin.`,
          score: Math.floor(Math.random() * 4) + 2,
          date: new Date(Date.now() - index * 86400000).toISOString(),
          thumbsUp: 0,
          replyDate: null,
          replyText: null
        })),
        appInfo: {
          title: "Veri Çekilemedi",
          description: "Google Play Store'dan veri çekilemedi. Lütfen daha sonra tekrar deneyin.",
          score: 0,
          ratings: 0,
          reviews: 0,
          currentVersion: "N/A",
          developer: "Bilinmiyor",
          icon: "https://via.placeholder.com/512"
        }
      });
    }
  } catch (error) {
    console.error('Google Play Store yorumları çekilirken hata:', error);
    return NextResponse.json(
      { error: "Yorumlar çekilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 