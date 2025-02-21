'use client';

import { useState, useEffect } from 'react';
import { 
  FaHome,
  FaHistory,
  FaChartLine,
  FaBars,
  FaUser,
  FaSignOutAlt,
} from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from "jwt-decode";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { icon: FaHome, label: 'Genel Bakış', path: '/' },
  { icon: FaHistory, label: 'Geçmiş Analizler', path: '/history' },
  { icon: FaChartLine, label: 'Rakip Analizleri', path: '/competitors' },
];

interface UserToken {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function Sidebar() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: '',
    username: '',
    role: ''
  });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadUserProfile = () => {
      try {
        // Cookie'yi bul
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];

        console.log('Cookie içeriği:', document.cookie);
        console.log('Bulunan token:', token);

        if (token) {
          const decoded = jwtDecode<UserToken>(token);
          console.log('Çözümlenen token:', decoded);

          if (decoded && decoded.username && decoded.role) {
            console.log('Token geçerli, kullanıcı bilgileri ayarlanıyor:', {
              username: decoded.username,
              role: decoded.role
            });
            
            setUserProfile({
              name: decoded.username,
              username: decoded.username,
              role: decoded.role === 'admin' ? 'Yönetici' : 'Kayıtlı Kullanıcı'
            });
          } else {
            console.log('Token içeriği eksik veya geçersiz:', decoded);
            setUserProfile({
              name: 'Misafir',
              username: 'Misafir',
              role: 'Misafir Kullanıcı'
            });
          }
        } else {
          console.log('Token bulunamadı');
          setUserProfile({
            name: 'Misafir',
            username: 'Misafir',
            role: 'Misafir Kullanıcı'
          });
        }
      } catch (error) {
        console.error('Token çözme hatası:', error);
        setUserProfile({
          name: 'Misafir',
          username: 'Misafir',
          role: 'Misafir Kullanıcı'
        });
      }
    };

    loadUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Çıkış yapılırken bir hata oluştu');
      }

      router.push('/login');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      alert('Çıkış yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Mobil Toggle Butonu */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => {}}
      >
        <FaBars className="text-lg" />
      </button>

      <aside 
        className={`
          h-full bg-white/95 backdrop-blur-md
          border-r border-gray-100 shadow-xl
          transition-all duration-300 ease-in-out z-40
          w-64
          ${isMobile ? 'fixed top-0 left-0 -translate-x-full' : ''}
        `}
      >
        <div className="flex flex-col h-full relative">
          {/* Logo ve Header */}
          <div className="p-6">
            <div className="flex items-center justify-center">
              <div className="relative w-64 h-64 rounded-xl overflow-hidden">
                <Image
                  src="/TheClico_Logo.png"
                  alt="TheClico Logo"
                  width={256}
                  height={256}
                  className="object-contain rounded-xl"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
                />
              </div>
            </div>
          </div>

          {/* Ana Menü */}
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-300 group relative
                  ${item.path === pathname 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }
                `}
              >
                <div className={`
                  p-2.5 rounded-xl transition-all duration-300 relative group
                  ${item.path === pathname 
                    ? 'bg-gradient-to-br from-blue-100 to-blue-200/50' 
                    : 'group-hover:bg-gray-100'
                  }
                `}>
                  <item.icon className="text-lg" />
                </div>
                <span className="font-medium">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Kullanıcı Profili */}
          <div className="p-4 mt-auto">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                <FaUser className="text-sm" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{userProfile.username || 'Yükleniyor...'}</p>
                <p className="text-sm text-blue-600">{userProfile.role || 'Yükleniyor...'}</p>
              </div>
              <button 
                onClick={handleLogout}
                disabled={isLoading}
                className={`
                  ml-auto p-2 rounded-lg
                  ${isLoading 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }
                  transition-all duration-300
                `}
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
} 