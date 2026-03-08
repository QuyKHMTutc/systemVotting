import { Cpu, Coffee, Gamepad2, BookOpen, Trophy, Tag, Layers, LucideIcon } from 'lucide-react';

export interface CategoryDef {
    id: string;
    name: string;
    icon: LucideIcon;
}

export const CATEGORIES: CategoryDef[] = [
    { id: 'Công nghệ', name: 'Công nghệ', icon: Cpu },
    { id: 'Cuộc sống', name: 'Cuộc sống', icon: Coffee },
    { id: 'Game', name: 'Game', icon: Gamepad2 },
    { id: 'Giáo dục', name: 'Giáo dục', icon: BookOpen },
    { id: 'Thể thao', name: 'Thể thao', icon: Trophy },
    { id: 'Khác', name: 'Khác', icon: Tag },
];

export const ALL_CATEGORY: CategoryDef = { id: 'ALL', name: 'All Categories', icon: Layers };

export const getCategoryIcon = (categoryId: string): LucideIcon => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.icon : Tag;
};
