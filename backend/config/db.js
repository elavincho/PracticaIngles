import mongoose from 'mongoose';
import dotenv from 'dotenv';

let isDbConnectedState = false;

const connectDB = async () => {
  dotenv.config({ override: true });
  let uri = process.env.MONGODB_URI;

  if (typeof uri === 'string') {
    uri = uri.trim().replace(/^["']|["']$/g, '');
  }

  if (!uri || (typeof uri === 'string' && !uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    console.log('[MongoDB Status] MONGODB_URI no está configurado en las variables de entorno (.env) o es inválido.');
    isDbConnectedState = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB Status] Base de datos conectada correctamente a ${conn.connection.host}`);
    isDbConnectedState = true;
    return true;
  } catch (error) {
    console.log(`[MongoDB Status] Error de conexión a la base de datos: ${error.message}`);
    isDbConnectedState = false;
    return false;
  }
};

export const checkDbConnection = () => {
  return mongoose.connection.readyState === 1 || isDbConnectedState;
};

export default connectDB;

