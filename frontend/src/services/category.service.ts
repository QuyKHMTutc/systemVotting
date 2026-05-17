import api from './api';

export interface Category {
    id: number;
    name: string;
    slug: string;
    icon: string;  // emoji, e.g. "🔥", "💻"
    sortOrder: number;
    pollCount?: number;
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

    createCategory: async (category: Partial<Category>): Promise<Category> => {
        const response = await api.post('/categories', category);
        return response.data.data;
    },

    updateCategory: async (id: number, category: Partial<Category>): Promise<Category> => {
        const response = await api.put(`/categories/${id}`, category);
        return response.data.data;
    },

    deleteCategory: async (id: number): Promise<void> => {
        await api.delete(`/categories/${id}`);
    },
};
