import { CustomerFeedback } from '@/types/dashboard';
import { FaTwitter, FaFacebook, FaInstagram } from 'react-icons/fa';

interface FeedbackListProps {
  feedbacks: CustomerFeedback[];
}

const sourceIcons = {
  Twitter: FaTwitter,
  Facebook: FaFacebook,
  Instagram: FaInstagram,
};

const sentimentColors = {
  positive: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'text-green-500',
  },
  negative: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'text-red-500',
  },
  neutral: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: 'text-gray-500',
  },
};

export function FeedbackList({ feedbacks }: FeedbackListProps) {
  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => {
        const Icon = sourceIcons[feedback.source as keyof typeof sourceIcons];
        const colors = sentimentColors[feedback.sentiment];

        return (
          <div
            key={feedback.id}
            className={`${colors.bg} border ${colors.border} rounded-lg p-4 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  {Icon && <Icon className={`text-xl ${colors.icon}`} />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{feedback.source}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {new Date(feedback.date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                  <span className={`text-sm ${colors.text} font-medium`}>
                    {feedback.sentiment.charAt(0).toUpperCase() + feedback.sentiment.slice(1)}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {feedback.category}
              </span>
            </div>
            <p className="mt-3 text-gray-800 leading-relaxed">{feedback.content}</p>
            <div className="mt-4 flex items-center space-x-4">
              <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                <span>Yanıtla</span>
              </button>
              <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                <span>İncele</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
} 