import Vocabulary from '../models/Vocabulary.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import { allVocabulary } from '../data/allVocabulary.js';
import { checkDbConnection } from '../config/db.js';

export const getVocabulary = async (req, res) => {
  try {
    const { level, category, search } = req.query;
    const isConnected = checkDbConnection();

    if (isConnected) {
      const dbCount = await Vocabulary.countDocuments();
      if (dbCount === 0 && allVocabulary.length > 0) {
        // Initial seed from defaults if database is completely empty
        for (const wordObj of allVocabulary) {
          const { _id, id, ...cleanWord } = wordObj;
          await Vocabulary.create(cleanWord);
        }
      }

      let query = {};
      if (level) query.level = Number(level);
      if (category) query.category = category;
      if (search) {
        query.$or = [
          { word: { $regex: search, $options: 'i' } },
          { translation: { $regex: search, $options: 'i' } }
        ];
      }
      const items = await Vocabulary.find(query);
      return res.json(items);
    }

    // Static read-only fallback when DB is disconnected
    let items = [...allVocabulary.map((w, idx) => ({ ...w, _id: `vocab_${idx + 1}` }))];
    if (level) items = items.filter(item => item.level === Number(level));
    if (category) items = items.filter(item => item.category === category);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(item =>
        item.word.toLowerCase().includes(q) || item.translation.toLowerCase().includes(q)
      );
    }

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const { level } = req.query;
    const isConnected = checkDbConnection();
    let vocabList = [];

    if (isConnected) {
      const dbVocab = await Vocabulary.find({});
      if (dbVocab && dbVocab.length > 0) {
        vocabList = dbVocab;
      } else {
        vocabList = allVocabulary;
      }
    } else {
      vocabList = allVocabulary;
    }

    const categoriesMap = new Map();
    vocabList.forEach(item => {
      if (level && Number(level) !== Number(item.level)) return;
      if (!categoriesMap.has(item.category)) {
        categoriesMap.set(item.category, {
          name: item.category,
          level: Number(item.level),
          totalWords: 0
        });
      }
      const cat = categoriesMap.get(item.category);
      cat.totalWords += 1;
    });

    res.json(Array.from(categoriesMap.values()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recordActivityScore = async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({
        success: false,
        dbConnected: false,
        message: 'Base de datos no conectada. No se puede guardar el progreso sin conexión a la base de datos (MongoDB).'
      });
    }

    const {
      pointsEarned,
      levelCompleted,
      categoryCompleted,
      accuracy,
      studySeconds,
      activityType,
      matchedWords,
      attempts,
      moves,
      correctSentences,
      correctWords,
      activeLevel
    } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      return res.status(400).json({ message: 'Usuario no identificado' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado en la base de datos' });
    }

    user.points += pointsEarned || 10;
    if (studySeconds) user.studyTimeMinutes += Math.round(studySeconds / 60);

    // Calculate today words count and streak in DB
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const lastStr = user.lastStudyDate ? new Date(user.lastStudyDate).toISOString().slice(0, 10) : '';
    const wordAdd = matchedWords || correctSentences || correctWords || 20;

    if (todayStr !== lastStr) {
      // New day activity! Increment streak if studied yesterday or first time
      if (user.lastStudyDate) {
        const prevDate = new Date(user.lastStudyDate);
        const diffTime = Math.abs(now.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 2) {
          user.streak = (user.streak || 0) + 1;
        } else {
          user.streak = 1;
        }
      } else {
        user.streak = 1;
      }
      user.todayWordsCount = wordAdd;
      user.lastStudyDate = now;
    } else {
      user.todayWordsCount = (user.todayWordsCount || 0) + wordAdd;
    }

    if (categoryCompleted && !user.completedCategories.includes(categoryCompleted)) {
      user.completedCategories.push(categoryCompleted);
    }

    const lvl = activeLevel || levelCompleted || 1;
    if (activityType) {
      if (!user.activityStats) user.activityStats = {};
      if (!user.activityStats[activityType]) user.activityStats[activityType] = {};

      const currentStats = user.activityStats[activityType][lvl] || {};
      const nextAttempts = (currentStats.attempts || 0) + 1;

      if (activityType === 'dragdrop') {
        const prevMatched = currentStats.matchedWords || 0;
        const prevAttempts = currentStats.attempts || 999;
        const currentAttempts = (attempts !== undefined && attempts !== null) ? attempts : (matchedWords || 20);
        user.activityStats[activityType][lvl] = {
          matchedWords: Math.max(prevMatched, matchedWords || 20),
          attempts: prevAttempts === 999 ? currentAttempts : Math.min(prevAttempts, currentAttempts)
        };
      } else if (activityType === 'memory') {
        const prevMatched = currentStats.matchedWords || 0;
        const prevMoves = currentStats.moves || 999;
        const currentMoves = moves || 12;
        user.activityStats[activityType][lvl] = {
          matchedWords: Math.max(prevMatched, matchedWords || 20),
          moves: prevMoves === 999 ? currentMoves : Math.min(prevMoves, currentMoves),
          attempts: nextAttempts
        };
      } else if (activityType === 'fillblanks') {
        const prevCorrect = currentStats.correctSentences || 0;
        user.activityStats[activityType][lvl] = {
          correctSentences: Math.max(prevCorrect, correctSentences || 20),
          attempts: nextAttempts
        };
      } else if (activityType === 'listening') {
        const prevCorrect = currentStats.correctWords || 0;
        user.activityStats[activityType][lvl] = {
          correctWords: Math.max(prevCorrect, correctWords || 20),
          attempts: nextAttempts
        };
      }
      user.markModified('activityStats');
    }

    if (levelCompleted && accuracy >= 80) {
      // Find all categories belonging to levelCompleted from defaults and DB
      const defaultCatsForLevel = [...new Set(
        allVocabulary
          .filter(v => Number(v.level) === Number(levelCompleted))
          .map(v => v.category)
      )];

      let dbCats = [];
      if (checkDbConnection()) {
        dbCats = await Vocabulary.distinct('category', { level: levelCompleted });
      }

      const allLevelCats = Array.from(new Set([...defaultCatsForLevel, ...dbCats]));
      const allLevelCompleted = allLevelCats.length > 0 && allLevelCats.every(cat => user.completedCategories.includes(cat));

      if (allLevelCompleted) {
        if (user.unlockedLevel <= levelCompleted && user.unlockedLevel < 5) {
          user.unlockedLevel = levelCompleted + 1;
        }
        const badgeName = `Nivel ${levelCompleted} Completado`;
        if (!user.badges.includes(badgeName)) {
          user.badges.push(badgeName);
        }
      }
    }
    await user.save();

    res.json({
      success: true,
      message: 'Progreso guardado correctamente en la base de datos',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
