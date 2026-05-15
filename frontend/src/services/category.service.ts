import api from './api';

export interface Category {
    id: number;
    name: string;
    slug: string;
    icon: string;  // emoji, e.g. "🔥", "💻"
    sortOrder: number;
}

export const categoryService = {
    getAllCategories: async (): Promise<Category[]> => {
        const response = await api.get('/categories');
        return response.data.data;
    },

    getCategoryBySlug: async (slug: string): Promise<Category> => {
        const response = await api.get(`/categories/${slug}`);
        return response.data.data;
    },
};
