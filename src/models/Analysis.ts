import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['google', 'apple']
  },
  appInfo: {
    title: String,
    description: String,
    score: Number,
    ratings: Number,
    reviews: Number,
    currentVersion: String,
    developer: String,
    icon: String
  },
  analyzedReviews: [{
    id: String,
    userName: String,
    title: String,
    text: String,
    score: Number,
    date: Date,
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'mixed']
    },
    confidenceScores: {
      positive: Number,
      neutral: Number,
      negative: Number
    },
    mainCategory: String,
    subCategory: String,
    keywords: [String],
    sentimentScore: Number
  }],
  statistics: {
    total: Number,
    positive: Number,
    neutral: Number,
    negative: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Analysis || mongoose.model('Analysis', AnalysisSchema); 