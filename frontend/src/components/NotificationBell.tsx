import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, Reply, PieChart, MoreHorizontal, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notification.service';
import type { Notification } from '../services/notification.service';
import { useGlobalWebSocket } from '../contexts/WebSocketContext';
import type { IMessage } from '@stomp/stompjs';

export default function NotificationBell() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
    const [visibleCount, setVisibleCount] = useState(5);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const client = useGlobalWebSocket();

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getMyNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!client || !client.connected) return;
        
        // Lắng nghe socket
        const subscription = client.subscribe('/user/queue/notifications', (message: IMessage) => {
            if (message.body) {
                const newNotif: Notification = JSON.parse(message.body);
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
            }
        });
        
        return () => {
            subscription.unsubscribe();
        };
    }, [client]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.isRead) {
            try {
                await notificationService.markAsRead(notif.id);
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Failed to mark as read', error);
            }
        }
        setIsOpen(false);
        if (notif.relatedPollId) {
            const currentPath = `/poll/${notif.relatedPollId}`;
            if (notif.type === 'NEW_COMMENT' || notif.type === 'NEW_REPLY') {
                const search = notif.relatedCommentId ? `?commentId=${notif.relatedCommentId}` : '';
                if (window.location.pathname === currentPath && 
                    window.location.hash === '#comments' && 
                    window.location.search === search) {
                    // We are exactly on the same URL, just trigger hashchange to scroll
                    window.dispatchEvent(new HashChangeEvent("hashchange"));
                } else {
                    navigate(`${currentPath}${search}#comments`);
                }
            } else {
                navigate(currentPath);
            }
        }
    };

    const formatRelativeTime = (dateStr: string) => {
        const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return "Vừa xong";
        if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
        return `${Math.floor(diff / 86400)} ngày`;
    };

    const isToday = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const filteredNotifications = notifications.filter(n => filter === 'ALL' || !n.isRead);
    const visibleNotifications = filteredNotifications.slice(0, visibleCount);
    
    const todayNotifications = visibleNotifications.filter(n => isToday(n.createdAt));
    const earlierNotifications = visibleNotifications.filter(n => !isToday(n.createdAt));

    const renderBadge = (type: string) => {
        switch (type) {
            case 'NEW_COMMENT':
                return <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1e1b4b] shadow-sm"><MessageSquare className="w-3 h-3 text-white" /></div>;
            case 'NEW_REPLY':
                return <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1e1b4b] shadow-sm"><Reply className="w-3 h-3 text-white" /></div>;
            case 'NEW_VOTE':
                return <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1e1b4b] shadow-sm"><PieChart className="w-3 h-3 text-white" /></div>;
            default:
                return null;
        }
    };

    return (
        <div className="relative flex items-center" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300/50 dark:hover:bg-white/10 text-slate-700 dark:text-white/80 transition-colors border border-slate-300 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0a051d]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <div className={`absolute top-full right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#242526] border border-slate-200/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] transform origin-top-right transition-all duration-200 z-[60] ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                {/* Header */}
                <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Thông báo</h3>
                        <div className="flex items-center gap-2 relative">
                             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-white/60 transition-colors">
                                 <MoreHorizontal className="w-5 h-5" />
                             </button>
                             {isMenuOpen && (
                                 <>
                                     <div className="fixed inset-0 z-[65]" onClick={() => setIsMenuOpen(false)}></div>
                                     <div className="absolute top-10 right-0 w-60 bg-white dark:bg-[#303031] border border-slate-200/50 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-lg overflow-hidden z-[70] py-2">
                                        <button 
                                            onClick={() => { handleMarkAllRead(); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 dark:text-white/90 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-6 flex justify-center"><Check className="w-5 h-5" /></div>
                                            Đánh dấu tất cả đã đọc
                                        </button>
                                     </div>
                                 </>
                             )}
                        </div>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex items-center gap-2 mb-2">
                        <button 
                            onClick={() => setFilter('ALL')}
                            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === 'ALL' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white/80'}`}
                        >
                            Tất cả
                        </button>
                        <button 
                            onClick={() => setFilter('UNREAD')}
                            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === 'UNREAD' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white/80'}`}
                        >
                            Chưa đọc
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/20 pb-2">
                    {filteredNotifications.length === 0 ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center opacity-60">
                            <Bell className="w-10 h-10 mb-2 opacity-50 text-slate-500 dark:text-white" />
                            <p className="text-sm font-medium text-slate-600 dark:text-white/70">Không có thông báo nào</p>
                        </div>
                    ) : (
                        <div className="flex flex-col px-2">
                            {/* Hôm nay Group */}
                            {todayNotifications.length > 0 && (
                                <div className="mb-2">
                                    <h4 className="px-2 py-1 text-[15px] font-bold text-slate-800 dark:text-white mb-1">Hôm nay</h4>
                                    {todayNotifications.map(notif => (
                                        <NotificationItem key={notif.id} notif={notif} onClick={() => handleNotificationClick(notif)} renderBadge={renderBadge} formatTime={formatRelativeTime} />
                                    ))}
                                </div>
                            )}

                            {/* Trước đó Group */}
                            {earlierNotifications.length > 0 && (
                                <div>
                                    <h4 className="px-2 py-1 text-[15px] font-bold text-slate-800 dark:text-white mb-1">Trước đó</h4>
                                    {earlierNotifications.map(notif => (
                                        <NotificationItem key={notif.id} notif={notif} onClick={() => handleNotificationClick(notif)} renderBadge={renderBadge} formatTime={formatRelativeTime} />
                                    ))}
                                </div>
                            )}
                            
                            {/* Nút xem thêm */}
                            {filteredNotifications.length > visibleCount && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setVisibleCount(prev => prev + 10); }}
                                    className="mt-2 mx-2 p-2 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-400 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-center"
                                >
                                    Xem thông báo trước đó
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function NotificationItem({ notif, onClick, renderBadge, formatTime }: { notif: Notification, onClick: () => void, renderBadge: (type: string) => React.ReactNode, formatTime: (d: string) => string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left flex gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors relative mb-1 ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''}`}
        >
            <div className="shrink-0 mt-0.5 relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-slate-200 dark:ring-white/10">
                    {notif.actorAvatar && notif.actorAvatar !== 'null' && notif.actorAvatar.trim() !== '' ? (
                        <img src={notif.actorAvatar.startsWith('http') || notif.actorAvatar.startsWith('blob') ? notif.actorAvatar : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${notif.actorAvatar}`} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${notif.actorName}` }} />
                    ) : (
                        <span className="text-lg font-bold text-indigo-500 dark:text-indigo-300">{notif.actorName.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                {renderBadge(notif.type)}
            </div>
            
            <div className="flex-1 min-w-0 pr-4">
                <p className="text-[14px] text-slate-800 dark:text-white leading-[1.3]">
                    <span className="font-semibold mr-1">{notif.actorName}</span>
                    {notif.type === 'NEW_COMMENT' && 'đã bình luận vào cuộc thăm dò của bạn:'}
                    {notif.type === 'NEW_REPLY' && 'đã trả lời bình luận của bạn:'}
                    {notif.type === 'NEW_VOTE' && 'đã tham gia bình chọn của bạn.'}
                </p>
                {(notif.type === 'NEW_COMMENT' || notif.type === 'NEW_REPLY') && (
                    <p className="text-[13px] text-slate-600 dark:text-white/60 truncate mt-0.5">"{notif.message}"</p>
                )}
                <p className={`text-[12px] font-medium mt-1 ${!notif.isRead ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-white/50'}`}>
                    {formatTime(notif.createdAt)}
                </p>
            </div>
            
            {!notif.isRead && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            )}
        </button>
    );
}
