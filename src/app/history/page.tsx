'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { FaGooglePlay, FaApple, FaChartBar, FaCalendar } from 'react-icons/fa';

interface Analysis {
  _id: string;
  platform: 'google' | 'apple';
  appInfo: {
    title: string;
  };
  statistics: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
  };
  createdAt: string;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
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
        throw new Error(data.error || 'Analizler getirilemedi');
      }

      setAnalyses(data.analyses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="sticky top-0 h-screen">
        <Sidebar />
      </div>
      
      <main className="flex-1 p-6 lg:p-8 transition-all duration-300">
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

                    {/* Tarih */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 