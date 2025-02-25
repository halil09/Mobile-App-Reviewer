import { NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

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

interface ReviewsResult {
  data: GooglePlayReview[];
}

interface AppStoreReviewEntry {
  id?: { label: string };
  author?: { name?: { label: string } };
  title?: { label: string };
  content?: { label: string };
  'im:rating'?: { label: string };
  updated?: { label: string };
  'im:version'?: { label: string };
}

interface AppStoreReview {
  id: string;
  userName: string;
  title: string;
  text: string;
  score: number;
  date: string;
  version: string;
  thumbsUp: number;
  replyDate: null;
  appVersion: string;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { platform, appId, appName } = await request.json();

    if (!platform || !appId) {
      return NextResponse.json(
        { error: 'Platform ve appId gerekli' },
        { status: 400 }
      );
    }

    if (platform === 'google') {
      try {
        // Google Play Store'dan uygulama bilgilerini al
        const appInfo = await gplay.app({ appId });

        // Google Play Store'dan yorumları al
        const reviewsResult = await gplay.reviews({
          appId,
          sort: gplay.sort.NEWEST,
          num: 100,
          country: 'tr',
          lang: 'tr'
        });

        // Yorumları düzenle
        const reviews = reviewsResult.data.map(review => ({
          id: review.id || String(Math.random()),
          userName: review.userName || 'Anonim',
          title: review.title || '',
          text: review.text || '',
          score: review.score || 0,
          thumbsUp: review.thumbsUp || 0,
          date: review.date || new Date().toISOString(),
          version: review.version || '',
          appVersion: review.appVersion || ''
        }));

        return NextResponse.json({
          appInfo: {
            title: appName || appInfo.title,
            description: appInfo.description,
            score: appInfo.score,
            ratings: appInfo.ratings,
            reviews: appInfo.reviews,
            currentVersion: appInfo.version,
            developer: appInfo.developer,
            developerId: appInfo.developerId,
            developerEmail: appInfo.developerEmail,
            developerWebsite: appInfo.developerWebsite,
            genre: appInfo.genre,
            price: appInfo.price,
            free: appInfo.free,
            icon: appInfo.icon
          },
          reviews
        });
      } catch (error) {
        console.error('Google Play veri çekme hatası:', error);
        return NextResponse.json(
          { error: 'Google Play verisi çekilirken bir hata oluştu' },
          { status: 500 }
        );
      }
    } else if (platform === 'apple') {
      try {
        // App Store'dan uygulama bilgilerini al
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

        // RSS feed üzerinden yorumları çek
        const rssResponse = await fetch(
          `https://itunes.apple.com/tr/rss/customerreviews/id=${appId}/sortBy=mostRecent/page=1/json`
        );

        if (!rssResponse.ok) {
          throw new Error("App Store'dan yorumlar çekilemedi");
        }

        const rssData = await rssResponse.json();
        let reviews = [];

        // Feed yapısını kontrol et ve yorumları işle
        if (rssData.feed && rssData.feed.entry) {
          const entries = Array.isArray(rssData.feed.entry) ? rssData.feed.entry : [rssData.feed.entry];
          
          reviews = entries
            .filter((entry: AppStoreReviewEntry) => entry && typeof entry === 'object')
            .map((entry: AppStoreReviewEntry) => {
              try {
                return {
                  id: entry.id?.label || String(Math.random()),
                  userName: entry.author?.name?.label || 'Anonim',
                  title: entry.title?.label || '',
                  text: entry.content?.label || '',
                  score: parseInt(entry['im:rating']?.label || '0', 10),
                  date: new Date(entry.updated?.label || Date.now()).toISOString(),
                  version: entry['im:version']?.label || '',
                  thumbsUp: 0,
                  replyDate: null,
                  appVersion: entry['im:version']?.label || ''
                } as AppStoreReview;
              } catch (err) {
                console.warn('Yorum işleme hatası:', err);
                return null;
              }
            })
            .filter((review: AppStoreReview | null): review is AppStoreReview => review !== null);
        }

        // Uygulama bilgilerini hazırla
        const appInfo = {
          title: appName || appInfoData.results[0].trackName,
          description: appInfoData.results[0].description,
          developer: appInfoData.results[0].artistName,
          icon: appInfoData.results[0].artworkUrl100,
          score: appInfoData.results[0].averageUserRating || 0,
          ratings: appInfoData.results[0].userRatingCount || 0,
          reviews: appInfoData.results[0].userRatingCountForCurrentVersion || 0,
          currentVersion: appInfoData.results[0].version,
          price: appInfoData.results[0].formattedPrice,
          genre: appInfoData.results[0].primaryGenreName,
          developerId: appInfoData.results[0].artistId?.toString() || '',
          developerWebsite: appInfoData.results[0].sellerUrl || '',
          free: appInfoData.results[0].price === 0,
          developerEmail: ''
        };

        if (reviews.length === 0) {
          console.warn('Hiç yorum bulunamadı veya yorumlar işlenemedi');
        }

        return NextResponse.json({ 
          appInfo,
          reviews
        });

      } catch (error) {
        console.error('App Store veri çekme hatası:', error);
        return NextResponse.json(
          { error: 'App Store verisi çekilirken bir hata oluştu' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Geçersiz platform' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Veri çekme hatası:', error);
    return NextResponse.json(
      { error: 'Veriler çekilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 