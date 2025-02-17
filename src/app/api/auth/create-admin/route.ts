import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();

    // Admin kullanıcısı var mı kontrol et
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin kullanıcısı zaten mevcut' },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Admin kullanıcısını oluştur
    const admin = new User({
      username: 'admin',
      password: hashedPassword,
      name: 'Admin Kullanıcı',
      role: 'admin'
    });

    await admin.save();

    return NextResponse.json({
      success: true,
      message: 'Admin kullanıcısı oluşturuldu',
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Admin oluşturma hatası:', error);
    return NextResponse.json(
      { error: 'Admin kullanıcısı oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
} 