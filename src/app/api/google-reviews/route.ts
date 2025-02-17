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