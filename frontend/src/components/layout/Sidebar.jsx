import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BrainCircuit, 
  History, 
  UserCircle, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['admin', 'dosen_pa'] },
    { name: 'Daftar Mahasiswa', icon: <Users size={20} />, path: '/mahasiswa', roles: ['admin', 'dosen_pa'] },
    { name: 'Training Model', icon: <BrainCircuit size={20} />, path: '/ml/training', roles: ['admin'] },
    { name: 'Evaluasi Model', icon: <History size={20} />, path: '/ml/evaluation', roles: ['admin'] },
    { name: 'Profil Saya', icon: <UserCircle size={20} />, path: '/profile', roles: ['admin', 'dosen_pa', 'mahasiswa'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-primary-600 flex items-center">
          <BrainCircuit className="mr-2" />
          EWS Informatika
        </h1>
        <p className="text-xs text-gray-500 mt-1">Universitas Negeri Padang</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${isActive 
                ? 'bg-primary-50 text-primary-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <div className="flex items-center">
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </div>
            <ChevronRight size={14} className="opacity-50" />
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center p-3 mb-4 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">
            {user?.name.charAt(0)}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <LogOut size={18} className="mr-3" />
          Keluar Sesi
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
