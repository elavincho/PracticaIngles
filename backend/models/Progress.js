import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: true },
  mastered: { type: Boolean, default: false },
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  lastReviewed: { type: Date, default: Date.now }
}, { timestamps: true });

progressSchema.index({ userId: 1, wordId: 1 }, { unique: true });

const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
export default Progress;
