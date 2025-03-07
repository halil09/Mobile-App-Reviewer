import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['google', 'apple']
  },
  appInfo: {
    title: String,
    description: String,
    icon: String,
    score: Number,
    ratings: Number,
    reviews: Number,
    currentVersion: String,
    developer: String,
    developerId: String,
    developerEmail: String,
    developerWebsite: String,
    genre: String,
    price: String,
    free: Boolean,
    insights: String
  },
  analyzedReviews: [{
    id: String,
    text: String,
    score: Number,
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'mixed']
    },
    date: String,
    confidenceScores: {
      positive: Number,
      neutral: Number,
      negative: Number
    },
    mainCategory: String,
    subCategory: String,
    keywords: [String],
    sentimentScore: Number,
    userName: String
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

// Her kullanıcı için en fazla 5 analiz sakla
AnalysisSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      const count = await mongoose.models.Analysis.countDocuments({
        userId: this.userId
      });

      if (count >= 5) {
        // En eski analizi bul ve sil
        const oldestAnalysis = await mongoose.models.Analysis.findOne({
          userId: this.userId
        }).sort({ createdAt: 1 });

        if (oldestAnalysis) {
          await oldestAnalysis.deleteOne();
        }
      }
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.models.Analysis || mongoose.model('Analysis', AnalysisSchema); 