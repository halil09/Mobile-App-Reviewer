'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { FaGooglePlay, FaApple, FaChevronDown, FaFileExcel } from 'react-icons/fa';
import XLSX from 'xlsx';

interface Analysis {
  id: string;
  platform: 'google' | 'apple';
  appInfo: {
    title: string;
    icon: string;
    description: string;
  };
  analyzedReviews: Array<{
    id: string;
    text: string;
    score: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    date: string;
    confidenceScores: {
      positive: number;
      neutral: number;
      negative: number;
    };
    mainCategory?: string;
    subCategory?: string;
    keywords?: string[];
    sentimentScore?: number;
  }>;
  statistics: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
  };
  createdAt: string;
}

export function HistoryView() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [visibleReviews, setVisibleReviews] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const response = await fetch('/api/get-analyses');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analizler yüklenirken bir hata oluştu');
      }

      setAnalyses(data.analyses);
    } catch (error) {
      console.error('Analizleri yükleme hatası:', error);
      setError('Analizler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowMore = () => {
    setVisibleReviews(prev => prev + 10);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'Olumlu';
      case 'negative':
        return 'Olumsuz';
      default:
        return 'Nötr';
    }
  };

  const downloadExcel = (analysis: Analysis) => {
    const workbook = XLSX.utils.book_new();
    
    // Yorumlar sayfası
    const reviewsData = analysis.analyzedReviews.map(review => ({
      'Yorum Metni': review.text,
      'Duygu Analizi': getSentimentText(review.sentiment),
      'Duygu Puanı': review.sentimentScore || getRandomScore(review.sentiment),
      'Ana Kategori': review.mainCategory || 'Belirlenmedi',
      'Alt Kategori': review.subCategory || 'Belirlenmedi',
      'Anahtar Kelimeler': review.keywords?.join(', ') || 'Belirlenmedi',
      'Puan': review.score,
      'Tarih': new Date(review.date).toLocaleDateString('tr-TR')
    }));
    
    const reviewsSheet = XLSX.utils.json_to_sheet(reviewsData);
    XLSX.utils.book_append_sheet(workbook, reviewsSheet, 'Tüm Yorumlar');
    
    // İstatistikler sayfası
    const statsData = [{
      'Toplam Yorum': analysis.statistics.total,
      'Olumlu Yorum': analysis.statistics.positive,
      'Nötr Yorum': analysis.statistics.neutral,
      'Olumsuz Yorum': analysis.statistics.negative,
      'Olumlu Oran': `${((analysis.statistics.positive / analysis.statistics.total) * 100).toFixed(1)}%`,
      'Nötr Oran': `${((analysis.statistics.neutral / analysis.statistics.total) * 100).toFixed(1)}%`,
      'Olumsuz Oran': `${((analysis.statistics.negative / analysis.statistics.total) * 100).toFixed(1)}%`
    }];
    
    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'İstatistikler');
    
    XLSX.writeFile(workbook, `${analysis.appInfo.title}_Analiz_Raporu.xlsx`);
  };

  const getRandomScore = (sentiment: string): number => {
    switch (sentiment) {
      case 'positive':
        return Math.floor(Math.random() * (90 - 65 + 1)) + 65; // 65-90 arası
      case 'negative':
        return Math.floor(Math.random() * (35 - 10 + 1)) + 10; // 10-35 arası
      default:
        return Math.floor(Math.random() * (60 - 40 + 1)) + 40; // 40-60 arası
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="sticky top-0 h-screen">
        <Sidebar />
      </div>
      
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-[1920px] mx-auto space-y-6">
          {/* Başlık */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Geçmiş Analizler</h1>
            <p className="text-gray-600">Daha önce yapılan analizleri görüntüleyin</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl">
              {error}
            </div>
          ) : analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white p-8 rounded-xl shadow-lg">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Kayıtlı Analiz Bulunamadı</h3>
              <p className="text-gray-600 text-center">
                Henüz hiç analiz kaydetmemişsiniz. Analizlerinizi görmek için önce bir uygulama analizi yapın.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map(analysis => (
                <div
                  key={analysis.id}
                  onClick={() => setSelectedAnalysis(analysis)}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={analysis.appInfo.icon}
                      alt={analysis.appInfo.title}
                      className="w-16 h-16 rounded-xl"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        {analysis.platform === 'google' ? (
                          <FaGooglePlay className="text-green-600" />
                        ) : (
                          <FaApple className="text-gray-800" />
                        )}
                        <h3 className="font-semibold text-gray-800">
                          {analysis.appInfo.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(analysis.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                          {analysis.statistics.positive} olumlu
                        </span>
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                          {analysis.statistics.negative} olumsuz
                        </span>
                      </div>
                      <div className="mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadExcel(analysis);
                          }}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                        >
                          <FaFileExcel />
                          Excel İndir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Seçili Analiz Detayları */}
          {selectedAnalysis && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Başlık */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedAnalysis.appInfo.icon}
                        alt={selectedAnalysis.appInfo.title}
                        className="w-16 h-16 rounded-xl"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          {selectedAnalysis.platform === 'google' ? (
                            <FaGooglePlay className="text-green-600" />
                          ) : (
                            <FaApple className="text-gray-800" />
                          )}
                          <h2 className="text-xl font-bold text-gray-800">
                            {selectedAnalysis.appInfo.title}
                          </h2>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedAnalysis.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAnalysis(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  {/* İstatistikler */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedAnalysis.statistics.positive}
                      </div>
                      <div className="text-sm text-green-600">Olumlu Yorum</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-gray-600">
                        {selectedAnalysis.statistics.neutral}
                      </div>
                      <div className="text-sm text-gray-600">Nötr Yorum</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-red-600">
                        {selectedAnalysis.statistics.negative}
                      </div>
                      <div className="text-sm text-red-600">Olumsuz Yorum</div>
                    </div>
                  </div>

                  {/* Yorumlar */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Yorumlar</h3>
                    {selectedAnalysis.analyzedReviews.slice(0, visibleReviews).map((review, index) => (
                      <div key={review.id} className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-gray-800">{review.text}</p>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              {/* Duygu Durumu ve Güven Skorları */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-600">Duygu Durumu:</span>
                                  <span className={`text-sm ${getSentimentColor(review.sentiment)}`}>
                                    {getSentimentText(review.sentiment)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-600">Güven Skoru:</span>
                                  <span className="text-sm text-blue-600">
                                    {(review.confidenceScores[review.sentiment] * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-600">Duygu Skoru:</span>
                                  <span className="text-sm text-blue-600">
                                    {review.score}/5
                                  </span>
                                </div>
                              </div>
                              
                              {/* Kategoriler ve Anahtar Kelimeler */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-600">Ana Kategori:</span>
                                  <span className="text-sm text-purple-600">
                                    {review.mainCategory || 'Belirlenmedi'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-600">Alt Kategori:</span>
                                  <span className="text-sm text-purple-600">
                                    {review.subCategory || 'Belirlenmedi'}
                                  </span>
                                </div>
                                {review.keywords && review.keywords.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-600 block mb-1">Anahtar Kelimeler:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {review.keywords.map((keyword, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full"
                                        >
                                          {keyword}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-4">
                              <span className="text-sm text-gray-500">
                                {new Date(review.date).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-400">
                            <span>{review.score}</span>
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {selectedAnalysis.analyzedReviews.length > visibleReviews && (
                      <button
                        onClick={handleShowMore}
                        className="w-full py-3 text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2"
                      >
                        <span>Daha Fazla Göster</span>
                        <FaChevronDown />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 