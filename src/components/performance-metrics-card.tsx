import { PerformanceMetrics } from '@/types/dashboard';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

interface PerformanceMetricsCardProps {
  data: PerformanceMetrics;
}

const trendConfig = {
  up: {
    icon: FaArrowUp,
    gradient: 'from-green-50 to-green-100',
    text: 'text-green-700',
    bar: 'from-green-400 to-green-500',
  },
  down: {
    icon: FaArrowDown,
    gradient: 'from-red-50 to-red-100',
    text: 'text-red-700',
    bar: 'from-red-400 to-red-500',
  },
  stable: {
    icon: FaMinus,
    gradient: 'from-gray-50 to-gray-100',
    text: 'text-gray-700',
    bar: 'from-gray-400 to-gray-500',
  },
};

export function PerformanceMetricsCard({ data }: PerformanceMetricsCardProps) {
  const config = trendConfig[data.trend];
  const Icon = config.icon;

  return (
    <div className={`
      bg-gradient-to-br ${config.gradient} rounded-xl p-5
      hover:shadow-md hover:translate-x-1 transition-all duration-300
    `}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-800 font-medium">{data.metric}</h3>
        <div className={`flex items-center space-x-1.5 ${config.text}`}>
          <Icon className="text-sm" />
          <span className="text-sm font-medium">
            {data.change > 0 ? '+' : ''}{data.change}
            {data.metric.includes('Oran') ? '%' : ''}
          </span>
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-gray-900">
            {data.value}
            {data.metric.includes('Oran') ? '%' : ''}
          </span>
          <p className="text-sm text-gray-500 mt-1">Son 30 gün</p>
        </div>
        
        <div className="h-10 w-24">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${config.bar} rounded-full transition-all duration-300`}
              style={{ 
                width: `${Math.min(Math.abs(data.change) * 2, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 