import { DashboardData } from '../types/dashboard';

export const sampleData: DashboardData = {
  socialMedia: [
    {
      platform: 'twitter',
      mentions: 1250,
      sentiment: 0.75,
      engagement: 3200,
      followers: 25000,
      growth: 5.2
    },
    {
      platform: 'facebook',
      mentions: 850,
      sentiment: 0.68,
      engagement: 4500,
      followers: 45000,
      growth: 3.8
    },
    {
      platform: 'instagram',
      mentions: 2100,
      sentiment: 0.82,
      engagement: 8900,
      followers: 52000,
      growth: 7.4
    },
    {
      platform: 'linkedin',
      mentions: 420,
      sentiment: 0.88,
      engagement: 1800,
      followers: 15000,
      growth: 4.6
    }
  ],
  competitors: [
    {
      name: 'Rakip A',
      marketShare: 28,
      sentiment: 0.72,
      engagement: 15000,
      growth: 4.2
    },
    {
      name: 'Rakip B',
      marketShare: 22,
      sentiment: 0.65,
      engagement: 12000,
      growth: 3.8
    },
    {
      name: 'Rakip C',
      marketShare: 18,
      sentiment: 0.70,
      engagement: 9500,
      growth: 5.1
    }
  ],
  feedback: [
    {
      id: '1',
      source: 'Twitter',
      sentiment: 'positive',
      content: 'Harika müşteri hizmeti! Sorunum hemen çözüldü.',
      date: '2024-03-15',
      category: 'Müşteri Hizmetleri'
    },
    {
      id: '2',
      source: 'Facebook',
      sentiment: 'neutral',
      content: 'Ürün iyi ama teslimat biraz geç oldu.',
      date: '2024-03-14',
      category: 'Teslimat'
    },
    {
      id: '3',
      source: 'Instagram',
      sentiment: 'positive',
      content: 'Yeni koleksiyon çok başarılı!',
      date: '2024-03-13',
      category: 'Ürün'
    }
  ],
  performance: [
    {
      metric: 'Müşteri Memnuniyeti',
      value: 92,
      change: 3.5,
      trend: 'up'
    },
    {
      metric: 'Ortalama Yanıt Süresi',
      value: 2.5,
      change: -0.5,
      trend: 'down'
    },
    {
      metric: 'Etkileşim Oranı',
      value: 78,
      change: 5.2,
      trend: 'up'
    },
    {
      metric: 'Dönüşüm Oranı',
      value: 4.2,
      change: 0.8,
      trend: 'up'
    }
  ]
}; 