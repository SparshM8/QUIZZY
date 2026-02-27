import React, { useState, useEffect } from 'react';
import { Users, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authAPI } from '../api';

interface AdminUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface RoleManagementProps {
  currentUser: any;
  addNotification: (title: string, message: string, type: string) => void;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ currentUser, addNotification }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAdmins();
      setAdmins(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin users');
      addNotification('Error', 'Failed to load admin users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setLoading(true);
      await authAPI.updateUserRole(userId, newRole);
      await loadAdmins();
      addNotification('Role Updated', `User role has been updated to ${newRole}`, 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
      addNotification('Error', err.message || 'Failed to update role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'manager':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '👑';
      case 'admin':
        return '🛡️';
      case 'manager':
        return '⚙️';
      default:
        return '👤';
    }
  };

  if (currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only Super Administrators can manage user roles.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Role Management</h1>
              <p className="text-gray-600">Manage administrator roles and permissions</p>
            </div>
          </div>
        </div>

        {/* Role Hierarchy Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Role Hierarchy</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-2xl mb-2">👑</div>
              <h3 className="font-semibold text-purple-900 mb-1">Super Admin</h3>
              <p className="text-sm text-purple-700">Full system access, can manage all roles</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-2xl mb-2">🛡️</div>
              <h3 className="font-semibold text-blue-900 mb-1">Admin</h3>
              <p className="text-sm text-blue-700">Manage exams, students, and certificates</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-semibold text-green-900 mb-1">Manager</h3>
              <p className="text-sm text-green-700">Create and monitor exams</p>
            </div>
          </div>
        </div>

        {/* Admin Users List */}
        {loading && admins.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading administrators...</p>
          </div>
        ) : error && admins.length === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={loadAdmins}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Administrator Users ({admins.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Current Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {admins.map((admin) => {
                    const userId = admin._id || admin.id;
                    const isCurrentUser = userId === currentUser.id || userId === currentUser._id;
                    
                    return (
                      <tr key={userId} className={`hover:bg-gray-50 ${isCurrentUser ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {admin.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {admin.name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-blue-600">(You)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{admin.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(admin.role)}`}>
                            <span>{getRoleIcon(admin.role)}</span>
                            <span>{admin.role.replace('_', ' ').toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {isCurrentUser ? (
                            <span className="text-xs text-gray-500">Cannot modify own role</span>
                          ) : (
                            <select
                              value={admin.role}
                              onChange={(e) => handleRoleChange(userId, e.target.value)}
                              disabled={loading}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {admins.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mt-6">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No Administrators Found</h3>
            <p className="text-gray-500">Administrator users will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;
