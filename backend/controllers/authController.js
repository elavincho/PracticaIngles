import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { checkDbConnection } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'a1_vocab_jwt_secret_key_2026_super_secure';

export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const register = async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({
        success: false,
        dbConnected: false,
        message: 'Base de datos no conectada. No es posible registrar usuarios sin conexión a la base de datos (MongoDB).'
      });
    }

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user'
    });

    const token = generateToken(user);
    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        streak: user.streak,
        unlockedLevel: user.unlockedLevel,
        badges: user.badges,
        completedCategories: user.completedCategories,
        avatarUrl: user.avatarUrl || '',
        phone: user.phone || '',
        bio: user.bio || '',
        address: user.address || '',
        occupation: user.occupation || ''
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({
        success: false,
        dbConnected: false,
        message: 'Base de datos no conectada. No es posible iniciar sesión sin conexión a la base de datos (MongoDB).'
      });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Proporcione correo y contraseña' });
    }

    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      const token = generateToken(user);
      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          points: user.points,
          streak: user.streak,
          unlockedLevel: user.unlockedLevel,
          badges: user.badges,
          completedCategories: user.completedCategories,
          avatarUrl: user.avatarUrl || '',
          phone: user.phone || '',
          bio: user.bio || '',
          address: user.address || '',
          occupation: user.occupation || ''
        },
        token
      });
    }

    return res.status(401).json({ message: 'Credenciales inválidas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({
        success: false,
        dbConnected: false,
        message: 'Base de datos no conectada.'
      });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastStr = user.lastStudyDate ? new Date(user.lastStudyDate).toISOString().slice(0, 10) : '';
      if (todayStr !== lastStr) {
        user.todayWordsCount = 0;
        user.lastStudyDate = new Date();
        await user.save();
      }
      return res.json(user);
    }
    res.status(404).json({ message: 'Usuario no encontrado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({
        success: false,
        dbConnected: false,
        message: 'Base de datos no conectada.'
      });
    }

    const { name, email, avatarUrl, phone, bio, address, occupation } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (address !== undefined) user.address = address;
    if (occupation !== undefined) user.occupation = occupation;

    await user.save();

    const updated = await User.findById(user._id).select('-password');
    return res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const { type = 'global', level = 1 } = req.query;
    const lvl = parseInt(level, 10) || 1;

    // Default registered users sample data if database has no records or DB disconnected
    const fallbackRegisteredUsers = [
      {
        id: '1', name: 'Admin VocabMaster', role: 'admin', points: 3450, unlockedLevel: 5,
        activityStats: {
          dragdrop: { 1: { matchedWords: 20, attempts: 21 } },
          memory: { 1: { matchedWords: 20, moves: 10 } },
          fillblanks: { 1: { correctSentences: 20 } },
          listening: { 1: { correctWords: 20 } }
        }
      },
      {
        id: '2', name: 'Carlos Mendoza', role: 'user', points: 1850, unlockedLevel: 2,
        activityStats: {
          dragdrop: { 1: { matchedWords: 20, attempts: 22 } },
          memory: { 1: { matchedWords: 20, moves: 12 } },
          fillblanks: { 1: { correctSentences: 19 } },
          listening: { 1: { correctWords: 19 } }
        }
      },
      {
        id: '3', name: 'Laura Gómez', role: 'user', points: 1420, unlockedLevel: 2,
        activityStats: {
          dragdrop: { 1: { matchedWords: 18, attempts: 23 } },
          memory: { 1: { matchedWords: 18, moves: 14 } },
          fillblanks: { 1: { correctSentences: 18 } },
          listening: { 1: { correctWords: 18 } }
        }
      },
      {
        id: '4', name: 'Ana Torres', role: 'user', points: 1180, unlockedLevel: 1,
        activityStats: {
          dragdrop: { 1: { matchedWords: 15, attempts: 25 } },
          memory: { 1: { matchedWords: 15, moves: 16 } },
          fillblanks: { 1: { correctSentences: 15 } },
          listening: { 1: { correctWords: 15 } }
        }
      },
      {
        id: '5', name: 'Diego Ramos', role: 'user', points: 950, unlockedLevel: 1,
        activityStats: {
          dragdrop: { 1: { matchedWords: 12, attempts: 28 } },
          memory: { 1: { matchedWords: 12, moves: 18 } },
          fillblanks: { 1: { correctSentences: 12 } },
          listening: { 1: { correctWords: 12 } }
        }
      }
    ];

    let rawUsers = [];
    if (checkDbConnection()) {
      rawUsers = await User.find({})
        .select('name email role points unlockedLevel badges activityStats')
        .exec();
    }
    if (!rawUsers || rawUsers.length === 0) {
      rawUsers = fallbackRegisteredUsers;
    }

    let processedUsers = rawUsers.map(u => {
      const stats = u.activityStats || {};
      const dragDropLvl = stats.dragdrop?.[lvl] || stats.dragDrop?.[lvl];
      const memoryLvl = stats.memory?.[lvl];
      const fillLvl = stats.fillblanks?.[lvl] || stats.fillBlanks?.[lvl];
      const listenLvl = stats.listening?.[lvl];

      let targetLvl = null;
      if (type === 'dragdrop') targetLvl = dragDropLvl;
      else if (type === 'memory') targetLvl = memoryLvl;
      else if (type === 'fillblanks') targetLvl = fillLvl;
      else if (type === 'listening') targetLvl = listenLvl;

      let aciertos = null;
      let attempts = null;
      let moves = null;
      let correctSentences = null;
      let correctWords = null;

      if (targetLvl) {
        if (type === 'dragdrop') {
          aciertos = targetLvl.matchedWords ?? targetLvl.correctWords ?? null;
          attempts = targetLvl.attempts ?? null;
        } else if (type === 'memory') {
          aciertos = targetLvl.matchedWords ?? targetLvl.correctWords ?? null;
          moves = targetLvl.moves ?? null;
        } else if (type === 'fillblanks') {
          correctSentences = targetLvl.correctSentences ?? targetLvl.matchedWords ?? null;
          aciertos = correctSentences;
        } else if (type === 'listening') {
          correctWords = targetLvl.correctWords ?? targetLvl.matchedWords ?? null;
          aciertos = correctWords;
        }
      } else if (type === 'global') {
        aciertos = u.points || 0;
      }

      return {
        id: u._id ? u._id.toString() : (u.id || Math.random().toString()),
        name: u.name,
        email: u.email,
        role: u.role,
        points: u.points || 0,
        unlockedLevel: u.unlockedLevel || 1,
        aciertos,
        attempts,
        moves,
        correctSentences,
        correctWords
      };
    });

    // Sort according to category type and level
    if (type === 'dragdrop') {
      processedUsers.sort((a, b) => {
        const attA = a.attempts;
        const attB = b.attempts;
        if (attA === null && attB === null) return b.points - a.points;
        if (attA === null) return 1;
        if (attB === null) return -1;
        if (attA !== attB) return attA - attB; // Menos intentos en primer lugar
        return b.points - a.points;
      });
    } else if (type === 'memory') {
      processedUsers.sort((a, b) => {
        const mvA = a.moves;
        const mvB = b.moves;
        if (mvA === null && mvB === null) return b.points - a.points;
        if (mvA === null) return 1;
        if (mvB === null) return -1;
        if (mvA !== mvB) return mvA - mvB; // Menos movimientos en primer lugar
        return b.points - a.points;
      });
    } else if (type === 'fillblanks') {
      processedUsers.sort((a, b) => {
        const valA = a.correctSentences;
        const valB = b.correctSentences;
        if (valA === null && valB === null) return b.points - a.points;
        if (valA === null) return 1;
        if (valB === null) return -1;
        if (valB !== valA) return valB - valA; // Más frases correctas
        return b.points - a.points;
      });
    } else if (type === 'listening') {
      processedUsers.sort((a, b) => {
        const valA = a.correctWords;
        const valB = b.correctWords;
        if (valA === null && valB === null) return b.points - a.points;
        if (valA === null) return 1;
        if (valB === null) return -1;
        if (valB !== valA) return valB - valA; // Más audios correctos
        return b.points - a.points;
      });
    } else {
      // global / points
      processedUsers.sort((a, b) => b.points - a.points);
    }

    const leaderboard = processedUsers.slice(0, 10).map((u, index) => ({
      ...u,
      rank: index + 1
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
