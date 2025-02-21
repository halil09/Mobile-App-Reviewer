'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { FaGooglePlay, FaApple, FaChartBar, FaCalendar, FaFileExcel, FaEye } from 'react-icons/fa';
import { FaStar, FaStarHalf, FaRegStar } from 'react-icons/fa';
import * as XLSX from 'xlsx';

interface Review {
  id: string;
  userName: string;
  text: string;
  score: number;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidenceScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface Analysis {
  _id: string;
  platform: 'google' | 'apple';
  appInfo: {
    title: string;
    icon?: string;
    developer?: string;
    score?: number;
  };
  statistics: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
  };
  analyzedReviews: Review[];
  createdAt: string;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const response = await fetch('/api/get-analyses');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analizler getirilemedi');
      }

      setAnalyses(data.analyses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadExcel = (analysis: Analysis) => {
    const workbook = XLSX.utils.book_new();
    
    // Genel istatistikler sayfası
    const statsData = [
      ['Uygulama Adı', analysis.appInfo.title],
      ['Platform', analysis.platform === 'google' ? 'Google Play Store' : 'App Store'],
      ['Toplam Yorum', analysis.statistics.total],
      ['Olumlu Yorumlar', analysis.statistics.positive],
      ['Nötr Yorumlar', analysis.statistics.neutral],
      ['Olumsuz Yorumlar', analysis.statistics.negative],
      ['Analiz Tarihi', new Date(analysis.createdAt).toLocaleString('tr-TR')]
    ];
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Genel İstatistikler');

    // Yorumlar sayfası
    const reviewsData = analysis.analyzedReviews.map(review => ({
      'Tarih': new Date(review.date).toLocaleString('tr-TR'),
      'Kullanıcı': review.userName,
      'Puan': review.score,
      'Yorum': review.text,
      'Duygu Durumu': review.sentiment === 'positive' ? 'Olumlu' : review.sentiment === 'negative' ? 'Olumsuz' : 'Nötr',
      'Olumlu Skor': review.confidenceScores.positive,
      'Nötr Skor': review.confidenceScores.neutral,
      'Olumsuz Skor': review.confidenceScores.negative
    }));
    const reviewsSheet = XLSX.utils.json_to_sheet(reviewsData);
    XLSX.utils.book_append_sheet(workbook, reviewsSheet, 'Yorumlar');

    // Excel dosyasını indir
    XLSX.writeFile(workbook, `${analysis.appInfo.title}_analiz_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderStars = (score: number = 0) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-yellow-400 text-sm" />
        ))}
        {hasHalfStar && <FaStarHalf className="text-yellow-400 text-sm" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="text-yellow-400 text-sm" />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700">{score.toFixed(1)}</span>
      </div>
    );
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'negative':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="sticky top-0 h-screen">
        <Sidebar />
      </div>
      
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-[1920px] mx-auto">
          {/* Başlık */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Geçmiş Analizler</h1>
            <p className="mt-2 text-gray-600">
              Daha önce yapılan tüm analizleri görüntüleyin ve inceleyin
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-xl">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map((analysis) => (
                <div
                  key={analysis._id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    {/* Platform ve Uygulama Bilgisi */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          analysis.platform === 'google' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {analysis.platform === 'google' ? <FaGooglePlay /> : <FaApple />}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {analysis.appInfo?.title || 'İsimsiz Uygulama'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {analysis.platform === 'google' ? 'Google Play Store' : 'App Store'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* İstatistikler */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Toplam Yorum</span>
                        <span className="font-medium text-gray-800">{analysis.statistics.total}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-green-600">Olumlu</div>
                          <div className="font-medium text-green-700">{analysis.statistics.positive}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Nötr</div>
                          <div className="font-medium text-gray-700">{analysis.statistics.neutral}</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="text-sm text-red-600">Olumsuz</div>
                          <div className="font-medium text-red-700">{analysis.statistics.negative}</div>
                        </div>
                      </div>
                    </div>

                    {/* Tarih ve Aksiyonlar */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FaCalendar />
                          <span>
                            {new Date(analysis.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAnalysis(analysis);
                              setShowModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Detayları Görüntüle"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => downloadExcel(analysis)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Excel Olarak İndir"
                          >
                            <FaFileExcel />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detay Modalı */}
      {showModal && selectedAnalysis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    selectedAnalysis.platform === 'google' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedAnalysis.platform === 'google' ? <FaGooglePlay /> : <FaApple />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedAnalysis.appInfo.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedAnalysis.platform === 'google' ? 'Google Play Store' : 'App Store'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="space-y-6">
                {/* Yorumlar */}
                <div className="space-y-4">
                  {selectedAnalysis.analyzedReviews.map((review, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${getSentimentColor(review.sentiment)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {review.userName}
                          </span>
                          <span className="text-sm">
                            {renderStars(review.score)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{review.text}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          review.sentiment === 'positive' 
                            ? 'bg-green-100 text-green-700' 
                            : review.sentiment === 'negative'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {review.sentiment === 'positive' ? 'Olumlu' : review.sentiment === 'negative' ? 'Olumsuz' : 'Nötr'}
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full text-xs text-blue-700">
                          <span>Güven:</span>
                          <span className="font-medium">
                            {(review.confidenceScores[review.sentiment] * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 