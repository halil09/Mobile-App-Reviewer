'use client';

import { FaBell, FaSearch, FaUser, FaCog } from 'react-icons/fa';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-[1920px] mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 hidden md:block">
            <h1 className="text-xl font-semibold text-gray-800">İtibar Yönetimi Paneli</h1>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Ara..."
                className="w-72 px-4 py-2 pl-10 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            
            <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <FaBell className="text-xl" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <FaCog className="text-xl" />
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <FaUser className="text-sm" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">Admin Kullanıcı</p>
                <p className="text-xs text-gray-500">admin@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 