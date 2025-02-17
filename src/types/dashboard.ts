export interface SocialMediaMetrics {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
  mentions: number;
  sentiment: number;
  engagement: number;
  followers: number;
  growth: number;
}

export interface CompetitorAnalysis {
  name: string;
  marketShare: number;
  sentiment: number;
  engagement: number;
  growth: number;
}

export interface CustomerFeedback {
  id: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  content: string;
  date: string;
  category: string;
}

export interface PerformanceMetrics {
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DashboardData {
  socialMedia: SocialMediaMetrics[];
  competitors: CompetitorAnalysis[];
  feedback: CustomerFeedback[];
  performance: PerformanceMetrics[];
} 