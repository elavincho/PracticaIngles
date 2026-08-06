import mongoose from 'mongoose';

const vocabularySchema = new mongoose.Schema({
  word: { type: String, required: true, trim: true },
  translation: { type: String, required: true, trim: true },
  phonetic: { type: String, default: '' },
  category: { type: String, required: true },
  level: { type: Number, required: true, min: 1, max: 5 },
  imageUrl: { type: String, default: '' },
  exampleSentenceEn: { type: String, default: '' },
  exampleSentenceEs: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  failCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 }
}, { timestamps: true });

const Vocabulary = mongoose.models.Vocabulary || mongoose.model('Vocabulary', vocabularySchema);
export default Vocabulary;
