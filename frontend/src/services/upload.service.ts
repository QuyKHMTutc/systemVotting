import api from './api';

export interface UploadResponse {
    url: string;
}

/**
 * Upload ảnh lên Cloudinary qua backend.
 * Trả về URL HTTPS của ảnh đã lưu trên Cloudinary.
 *
 * @param file File ảnh (JPG/PNG/GIF/WebP, tối đa 5MB)
 * @param onProgress Callback nhận % tiến trình (0-100)
 */
export const uploadService = {
    uploadPollImage: async (
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<{ code: number; message: string; data: UploadResponse }>(
            '/files/upload-image',
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percent);
                    }
                },
            }
        );
        return response.data.data;
    },
};
