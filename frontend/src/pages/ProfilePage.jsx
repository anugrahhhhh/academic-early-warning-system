import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-4xl font-bold mx-auto mb-4">
          {user?.name.charAt(0)}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
        <p className="text-gray-500 capitalize font-medium">{user?.role.replace('_', ' ')} Program Studi Informatika</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-6 border-b pb-4">Informasi Akun</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <Mail className="text-gray-400 mr-4" size={20} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Shield className="text-gray-400 mr-4" size={20} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Role Sitem</p>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="text-gray-400 mr-4" size={20} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Terdaftar Sejak</p>
                <p className="font-medium">{new Date(user?.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold mb-6 border-b pb-4">Ubah Password</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
              <input type="password" placeholder="••••••••" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
              <input type="password" placeholder="••••••••" className="input-field" />
            </div>
            <button type="button" className="btn-primary w-full mt-2">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
