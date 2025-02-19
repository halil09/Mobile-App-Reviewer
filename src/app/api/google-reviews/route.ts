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

interface ReviewsResult {
  data?: GooglePlayReview[];
  [key: string]: any;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function fetchGooglePlayData(appId: string) {
  console.log('Fetching data for app ID:', appId);
  try {
    // Uygulama bilgilerini çek
    console.log('Fetching app info...');
    const appInfo = await gplay.app({
      appId: appId,
      lang: 'tr',
      country: 'tr'
    });
    console.log('App info fetched successfully');

    // Yorumları çek
    console.log('Fetching reviews...');
    const reviewsResult = await gplay.reviews({
      appId: appId,
      lang: 'tr',
      country: 'tr',
      sort: gplay.sort.NEWEST,
      num: 50 // 50 yorum çek
    });
    console.log('Reviews fetched successfully, count:', reviewsResult.length);

    // Yorumları formatla
    const reviews = (Array.isArray(reviewsResult) ? reviewsResult : []).map(review => ({
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return NextResponse.json({ error: 'App ID gerekli' }, { status: 400 });
    }

    // Google Play'den yorumları çek
    const reviewsResult = await gplay.reviews({
      appId: appId,
      lang: 'tr',
      country: 'tr',
      sort: gplay.sort.HELPFULNESS,
      num: 100
    });

    // Yorumları formatla
    const reviews = (Array.isArray(reviewsResult) ? reviewsResult : []).map((review: GooglePlayReview) => ({
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

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Google Play yorumları çekilirken hata:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Yorumlar çekilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { appId } = await request.json();
    console.log('Received request for app ID:', appId);

    if (!appId) {
      console.error('App ID eksik');
      return NextResponse.json({ error: 'App ID gerekli' }, { status: 400 });
    }

    // URL'yi temizle ve app ID'yi çıkar
    let cleanAppId = appId;
    
    // URL'nin başındaki @ işaretini kaldır
    cleanAppId = cleanAppId.replace(/^@/, '');
    
    // URL'den app ID'yi çıkar
    const appIdMatch = cleanAppId.match(/id=([^&]+)/);
    if (appIdMatch) {
      cleanAppId = appIdMatch[1];
    }
    
    console.log('Cleaned app ID:', cleanAppId);

    // Google Play'den yorumları çek
    console.log('Fetching reviews from Google Play...');
    try {
      const reviewsResult = await gplay.reviews({
        appId: cleanAppId,
        lang: 'tr',
        country: 'tr',
        sort: gplay.sort.NEWEST,
        num: 50 // 100'den 50'ye düşürüldü
      }) as ReviewsResult | GooglePlayReview[];

      // reviewsResult'ı işle
      let reviewsArray: GooglePlayReview[] = [];
      
      if (Array.isArray(reviewsResult)) {
        reviewsArray = reviewsResult;
      } else if (reviewsResult && 'data' in reviewsResult && Array.isArray(reviewsResult.data)) {
        reviewsArray = reviewsResult.data;
      }

      if (reviewsArray.length === 0) {
        console.error('Yorum bulunamadı:', reviewsResult);
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

      console.log('Formatted reviews count:', reviews.length);
      return NextResponse.json({ reviews });
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