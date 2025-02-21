import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    await connectDB();

    const { username, password } = await request.json();
    console.log('Giriş denemesi:', { username });

    // Kullanıcıyı bul
    const user = await User.findOne({ username });
    console.log('Kullanıcı bulundu:', !!user);

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Şifre kontrolü:', { isPasswordValid });

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // JWT token oluştur
    const tokenData = { 
      userId: user._id.toString(),
      username: user.username,
      role: user.role 
    };
    console.log('Token verisi:', tokenData);

    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: '1d' });
    console.log('Token oluşturuldu');

    // Response objesi oluştur
    const response = NextResponse.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });

    // Cookie'yi response üzerine ekle
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 // 1 gün
    });

    console.log('Cookie ayarlandı');
    return response;

  } catch (error) {
    console.error('Giriş hatası:', error);
    return NextResponse.json(
      { error: 'Giriş yapılırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 