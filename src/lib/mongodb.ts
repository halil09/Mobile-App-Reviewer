import mongoose, { Connection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI ortam değişkeni tanımlanmamış.');
}

declare global {
  var mongoose: {
    conn: Connection | null;
    promise: Promise<Connection> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<Connection> {
  try {
    if (cached && cached.conn) {
      console.log('Mevcut MongoDB bağlantısı kullanılıyor');
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
      };

      cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
        console.log('Yeni MongoDB bağlantısı oluşturuldu');
        return mongoose.connection;
      });
    }

    try {
      cached.conn = await cached.promise;
    } catch (e) {
      cached.promise = null;
      throw e;
    }

    return cached.conn;
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    throw error;
  }
}

export default connectDB; 