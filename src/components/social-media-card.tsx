import { SocialMediaMetrics } from '@/types/dashboard';
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';

interface SocialMediaCardProps {
  data: SocialMediaMetrics;
}

const platformIcons = {
  twitter: FaTwitter,
  facebook: FaFacebook,
  instagram: FaInstagram,
  linkedin: FaLinkedin,
};

const platformStyles = {
  twitter: {
    gradient: 'from-blue-400 to-blue-500',
    iconBg: 'bg-blue-400/30',
    hover: 'hover:from-blue-500 hover:to-blue-600',
  },
  facebook: {
    gradient: 'from-blue-600 to-blue-700',
    iconBg: 'bg-blue-600/30',
    hover: 'hover:from-blue-700 hover:to-blue-800',
  },
  instagram: {
    gradient: 'from-pink-500 to-purple-500',
    iconBg: 'bg-pink-500/30',
    hover: 'hover:from-pink-600 hover:to-purple-600',
  },
  linkedin: {
    gradient: 'from-blue-700 to-blue-800',
    iconBg: 'bg-blue-700/30',
    hover: 'hover:from-blue-800 hover:to-blue-900',
  },
};

export function SocialMediaCard({ data }: SocialMediaCardProps) {
  const Icon = platformIcons[data.platform];
  const style = platformStyles[data.platform];

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
      <div className={`bg-gradient-to-br ${style.gradient} ${style.hover} p-6 text-white transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`${style.iconBg} p-3 rounded-xl backdrop-blur-md`}>
            <Icon className="text-2xl" />
          </div>
          <span className="font-medium capitalize">{data.platform}</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-75">Takipçiler</p>
            <p className="text-2xl font-bold">{data.followers.toLocaleString()}</p>
          </div>
          <div className={`${data.growth > 0 ? 'bg-green-500/20' : 'bg-red-500/20'} px-2.5 py-1.5 rounded-lg backdrop-blur-md`}>
            <span className="text-sm font-medium">
              {data.growth > 0 ? '+' : ''}{data.growth}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Bahsedenler</p>
            <p className="text-lg font-semibold text-gray-800">
              {data.mentions.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Etkileşim</p>
            <p className="text-lg font-semibold text-gray-800">
              {data.engagement.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Duygu Analizi</span>
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-300"
                style={{ width: `${data.sentiment * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {(data.sentiment * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 