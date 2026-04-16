import { Cpu, Coffee, Gamepad2, BookOpen, Trophy, Tag, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TopicDef {
    id: string;
    name: string;
    icon: LucideIcon;
}

export const TOPICS: TopicDef[] = [
    { id: 'Công nghệ', name: 'Công nghệ', icon: Cpu },
    { id: 'Cuộc sống', name: 'Cuộc sống', icon: Coffee },
    { id: 'Game', name: 'Game', icon: Gamepad2 },
    { id: 'Giáo dục', name: 'Giáo dục', icon: BookOpen },
    { id: 'Thể thao', name: 'Thể thao', icon: Trophy },
    { id: 'Khác', name: 'Khác', icon: Tag },
];

export const ALL_TOPIC: TopicDef = { id: 'ALL', name: 'All Topics', icon: Layers };

export const getTopicIcon = (topicId: string): LucideIcon => {
    const topic = TOPICS.find(c => c.id === topicId);
    return topic ? topic.icon : Tag;
};
