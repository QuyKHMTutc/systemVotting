import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
    const { user, updateUser } = useAuth();

    // We initialize the states with the user's current info
    const [username, setUsername] = useState(user?.username || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(user?.avatarUrl || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen || !user) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('username', username);
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const response = await api.put('/users/me', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // Update Auth Context with the returned updated user data
            updateUser(response.data.data);
            setSuccess('Profile updated successfully!');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 transition-all duration-300 items-start pt-[15vh]">
            <div className="bg-[#1a1b26] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.15)] w-full max-w-lg overflow-hidden animate-fade-in-up flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 tracking-wide">Edit Profile</h2>
                        <p className="text-indigo-200/60 text-sm mt-1">Customize your public voting identity</p>
                    </div>
                    <button onClick={onClose} className="p-2 sm:p-2.5 bg-white/10 border border-white/20 text-white hover:bg-red-500 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-full transition-all duration-300 hover:rotate-90 focus:outline-none focus:ring-2 focus:ring-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/40 text-red-300 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/40 text-green-300 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8 flex flex-col">

                        {/* Avatar Section */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-white/5 p-6 rounded-2xl border border-white/5">
                            <div className="relative group shrink-0 w-24 h-24 rounded-full border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20 overflow-hidden bg-[#242636] flex items-center justify-center">
                                {previewUrl ? (
                                    <img src={previewUrl.startsWith('http') || previewUrl.startsWith('blob') ? previewUrl : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${previewUrl}`} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}` }} />
                                ) : (
                                    <span className="text-4xl font-bold text-indigo-300/80">{username.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-center sm:items-start justify-center flex-grow text-center sm:text-left space-y-3">
                                <div>
                                    <h3 className="text-white font-semibold flex items-center justify-center sm:justify-start gap-2">
                                        Profile Picture
                                    </h3>
                                    <p className="text-indigo-200/50 text-xs mt-1 max-w-[200px] leading-relaxed">
                                        Upload a new avatar or image, max size 2MB. Recommended 256x256px.
                                    </p>
                                </div>
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white/90 text-sm font-medium rounded-xl border border-white/10 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-auto"
                                    >
                                        Choose File
                                    </button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        title="Upload a new avatar"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Username Section */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-indigo-100/90 tracking-wide" htmlFor="username">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex-grow"
                                placeholder="Enter a cool username"
                                required
                                minLength={3}
                                maxLength={50}
                            />
                        </div>

                        {/* Email Section (Read-only reference) */}
                        <div className="space-y-3 opacity-60 pointer-events-none">
                            <label className="block text-sm font-semibold text-indigo-100/90 tracking-wide">
                                Email Address <span className="text-xs font-normal text-indigo-200/50 ml-2">(Cannot be changed)</span>
                            </label>
                            <input
                                type="text"
                                value={user.email}
                                readOnly
                                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white/70"
                            />
                        </div>

                    </form>
                </div>
                
                {/* Footer Actions */}
                <div className="bg-black/20 p-6 sm:px-8 border-t border-white/5 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-medium text-indigo-200 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all flex-1 sm:flex-none text-center"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        type="button"
                        disabled={loading}
                        className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none text-center"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;

