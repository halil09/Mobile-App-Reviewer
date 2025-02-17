import { CompetitorAnalysis } from '@/types/dashboard';
import { FaChartLine, FaUsers, FaSmile } from 'react-icons/fa';

interface CompetitorCardProps {
  data: CompetitorAnalysis;
}

export function CompetitorCard({ data }: CompetitorCardProps) {
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold bg-gradient-to-br from-gray-700 to-gray-900 bg-clip-text text-transparent">
            {data.name}
          </h3>
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-gray-600">Aktif</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Pazar Payı</span>
            <div className="flex items-center">
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden mr-2">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${data.marketShare}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">{data.marketShare}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-2.5 rounded-lg">
              <FaChartLine className="text-green-600 text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Büyüme</p>
              <p className="text-sm font-semibold text-gray-800">
                {data.growth > 0 ? '+' : ''}{data.growth}%
              </p>
            </div>
          </div>
          <div className={`px-2.5 py-1.5 rounded-lg text-sm font-medium ${
            data.growth > 0 
              ? 'bg-gradient-to-br from-green-50 to-green-100 text-green-700' 
              : 'bg-gradient-to-br from-red-50 to-red-100 text-red-700'
          }`}>
            {data.growth > 0 ? '↑' : '↓'} {Math.abs(data.growth)}%
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2.5 rounded-lg">
              <FaUsers className="text-purple-600 text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Etkileşim</p>
              <p className="text-sm font-semibold text-gray-800">
                {data.engagement.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 px-2.5 py-1.5 rounded-lg">
            Aylık
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-2.5 rounded-lg">
              <FaSmile className="text-yellow-600 text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Duygu Analizi</p>
              <p className="text-sm font-semibold text-gray-800">
                {(data.sentiment * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-300"
              style={{ width: `${data.sentiment * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 