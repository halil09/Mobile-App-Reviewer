import { NextResponse } from 'next/server';
import * as gplay from 'google-play-scraper';

interface GooglePlayReview {
  id?: string;
  userName?: string;
  title?: string;
  text?: string;
  score?: number;
  thumbsUp?: number;
  replyDate?: string;
  date?: string;
  version?: string;
  appVersion?: string;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { platform, appId, appName } = await request.json();

    if (!platform || !appId) {
      return NextResponse.json(
        { error: 'Platform ve App ID gerekli' },
        { status: 400 }
      );
    }

    if (platform === 'google') {
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
          sort: gplay.sort.NEWEST,
          num: 50
        });

        // reviewsResult'ı işle
        let reviewsArray: GooglePlayReview[] = [];
        
        if (Array.isArray(reviewsResult)) {
          reviewsArray = reviewsResult;
        }

        if (reviewsArray.length === 0) {
          return NextResponse.json({ error: 'Yorumlar çekilemedi' }, { status: 404 });
        }

        // Yorumları formatla
        const reviews = reviewsArray.map((review: GooglePlayReview) => ({
          id: review.id || Math.random().toString(),
          userName: review.userName || 'Anonim Kullanıcı',
          title: review.title || '',
          text: review.text || '',
          score: review.score || 0,
          thumbsUp: review.thumbsUp || 0,
          replyDate: review.replyDate || null,
          date: review.date || new Date().toISOString(),
          version: review.version || '',
          appVersion: review.appVersion || ''
        }));

        return NextResponse.json({
          appInfo: {
            title: appName || appInfo.title,
            description: appInfo.summary,
            score: appInfo.score,
            ratings: appInfo.ratings,
            reviews: appInfo.reviews,
            currentVersion: appInfo.version,
            developer: appInfo.developer,
            icon: appInfo.icon
          },
          reviews
        });

      } catch (error) {
        console.error('Google Play scraping error:', error);
        return NextResponse.json(
          { 
            error: 'Google Play yorumları çekilemedi',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
          },
          { status: 500 }
        );
      }
    } else {
      // App Store için mevcut kodu kullan
      try {
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

        // RSS feed üzerinden yorumları çekmeyi dene
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

        return NextResponse.json({ 
          appInfo,
          reviews: reviews.length > 0 ? reviews : []
        });

      } catch (error) {
        console.error('App Store yorumları çekilirken hata:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Yorumlar çekilirken bir hata oluştu" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Request handling error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Yorumlar çekilirken bir hata oluştu',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 