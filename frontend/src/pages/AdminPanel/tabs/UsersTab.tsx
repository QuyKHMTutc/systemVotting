import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Pagination } from '../../../components/common/Pagination';
import type { UserDTO } from '../../../services/user.service';

interface UsersTabProps {
  users: UserDTO[];
  pageUsers: number;
  setPageUsers: (p: number) => void;
  totalPagesUsers: number;
  fetchUsers: (p: number) => void;
  handleToggleLock: (u: UserDTO) => void;
  currentUser: any;
}

const UsersTab: React.FC<UsersTabProps> = ({
  users, pageUsers, setPageUsers, totalPagesUsers, fetchUsers, handleToggleLock, currentUser
}) => {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up shadow-xl" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.01] text-white/40 text-xs uppercase tracking-wider">
              {['#', 'User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                <th key={h} className={`px-6 py-4 font-semibold text-left ${i === 6 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-white/50">No users found</td></tr>
            ) : users.map((u, i) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-white/30 text-xs">{pageUsers * 20 + i + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                    ) : (
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-inner" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                          {u.username[0].toUpperCase()}
                        </div>
                    )}
                    <div>
                      <span className="text-white font-medium block">{u.username}</span>
                      {u.plan && u.plan !== 'FREE' && <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">{u.plan}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/50">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    u.role === 'ADMIN' ? 'text-violet-300 bg-violet-500/20' : 'text-white/60 bg-white/10'
                  }`}>{u.role}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    u.locked ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'
                  }`}>{u.locked ? 'Locked' : 'Active'}</span>
                </td>
                <td className="px-6 py-4 text-white/50">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4 text-right">
                  {u.id !== currentUser?.id && (
                    <button onClick={() => handleToggleLock(u)}
                      className={`flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        u.locked ? 'text-blue-400 border-blue-400/30 hover:bg-blue-400/10' : 'text-orange-400 border-orange-400/30 hover:bg-orange-400/10'
                      }`}>
                      {u.locked ? <><Unlock size={14} /> Unlock</> : <><Lock size={14} /> Lock</>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={pageUsers} totalPages={totalPagesUsers} onPageChange={(p) => { setPageUsers(p); fetchUsers(p); }} />
    </div>
  );
};

export default UsersTab;
