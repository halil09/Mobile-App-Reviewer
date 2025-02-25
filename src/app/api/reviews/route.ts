import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

export async function POST(request: Request) {
  try {
    const { appId } = await request.json();

    if (!appId) {
      return NextResponse.json(
        { error: "Geçerli bir App Store URLsi giriniz" },
        { status: 400 }
      );
    }

    // Önce uygulama bilgilerini çekelim
    const appInfoResponse = await fetch(
      `https://itunes.apple.com/lookup?id=${appId}&country=tr&entity=software`
    );

    if (!appInfoResponse.ok) {
      throw new Error("App Store'dan uygulama bilgileri çekilemedi");
    }

    const appInfoData = await appInfoResponse.json();
    
    if (!appInfoData.results || appInfoData.results.length === 0) {
      throw new Error("Uygulama bulunamadı");
    }

    let reviews = [];
    let reviewsFetched = false;

    // İlk yöntem: RSS feed üzerinden yorumları çekmeyi dene
    try {
      const rssResponse = await fetch(
        `https://itunes.apple.com/tr/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`
      );

      if (rssResponse.ok) {
        const rssData = await rssResponse.json();
        
        if (rssData.feed && Array.isArray(rssData.feed.entry)) {
          reviews = rssData.feed.entry.map((entry: any) => ({
            id: entry.id?.label || String(Math.random()),
            userName: entry.author?.name?.label || 'Anonim',
            title: entry.title?.label || '',
            text: entry.content?.label || '',
            score: parseInt(entry['im:rating']?.label || '0'),
            date: new Date(entry.updated?.label || Date.now()).toISOString(),
            version: entry['im:version']?.label || ''
          }));
          reviewsFetched = true;
        }
      }
    } catch (error) {
      console.warn('RSS feed üzerinden yorumlar çekilemedi, alternatif yönteme geçiliyor...');
    }

    // İkinci yöntem: Store API üzerinden yorumları çekmeyi dene
    if (!reviewsFetched) {
      try {
        const storeReviewsResponse = await fetch(
          `https://itunes.apple.com/tr/rss/customerreviews/page=1/id=${appId}/sortby=mostrecent/json`
        );

        if (storeReviewsResponse.ok) {
          const storeReviews = await storeReviewsResponse.json();
          if (storeReviews?.feed?.entry) {
            reviews = storeReviews.feed.entry.map((review: any) => ({
              id: review.id?.label || String(Math.random()),
              userName: review.author?.name?.label || 'Anonim',
              title: review.title?.label || '',
              text: review.content?.label || '',
              score: parseInt(review['im:rating']?.label || '0'),
              date: new Date(review.updated?.label || Date.now()).toISOString(),
              version: review['im:version']?.label || ''
            }));
            reviewsFetched = true;
          }
        }
      } catch (error) {
        console.warn('Store API üzerinden yorumlar çekilemedi');
      }
    }

    const appInfo = {
      title: appInfoData.results[0].trackName,
      description: appInfoData.results[0].description,
      developer: appInfoData.results[0].artistName,
      icon: appInfoData.results[0].artworkUrl100,
      score: appInfoData.results[0].averageUserRating,
      ratings: appInfoData.results[0].userRatingCount,
      reviews: appInfoData.results[0].userRatingCountForCurrentVersion,
      currentVersion: appInfoData.results[0].version,
      price: appInfoData.results[0].formattedPrice,
      genre: appInfoData.results[0].primaryGenreName
    };

    // Eğer hiç yorum bulunamazsa
    if (!reviewsFetched || reviews.length === 0) {
      return NextResponse.json({
        appInfo,
        reviews: [],
        warning: "Bu uygulama için henüz yorum bulunmamaktadır veya yorumlar şu anda erişilemez durumdadır."
      });
    }

    return NextResponse.json({ 
      appInfo,
      reviews 
    });

  } catch (error) {
    console.error('App Store yorumları çekilirken hata:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Yorumlar çekilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 