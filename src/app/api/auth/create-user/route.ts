import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();

    // Kullanıcı var mı kontrol et
    const existingUser = await User.findOne({ username: 'TheClico_Admin' });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash('TheClico_Admin123', 10);

    // Kullanıcıyı oluştur
    const user = new User({
      username: 'TheClico_Admin',
      password: hashedPassword,
      name: 'TheClico Admin',
      role: 'admin'
    });

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      credentials: {
        username: 'TheClico_Admin',
        password: 'TheClico_Admin123'
      }
    });
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
} 