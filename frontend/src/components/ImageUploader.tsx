import { useState, useRef, useCallback } from 'react';
import { uploadService } from '../services/upload.service';

interface ImageUploaderProps {
    onImageUploaded: (url: string) => void;
    onImageRemoved: () => void;
    imageUrl?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const ImageUploader = ({ onImageUploaded, onImageRemoved, imageUrl }: ImageUploaderProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState<string | null>(imageUrl ?? null);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return 'Chỉ chấp nhận ảnh JPG, PNG, GIF hoặc WebP.';
        }
        if (file.size > MAX_FILE_SIZE) {
            return 'Ảnh vượt quá kích thước tối đa 5MB.';
        }
        return null;
    };

    const handleFile = useCallback(async (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        setIsUploading(true);
        setProgress(0);

        // Hiển thị preview local ngay lập tức
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        try {
            const result = await uploadService.uploadPollImage(file, (pct) => setProgress(pct));
            setPreview(result.url); // Thay bằng URL Cloudinary chính thức
            onImageUploaded(result.url);
            URL.revokeObjectURL(objectUrl);
        } catch {
            setError('Upload thất bại. Vui lòng thử lại.');
            setPreview(null);
            URL.revokeObjectURL(objectUrl);
        } finally {
            setIsUploading(false);
            setProgress(0);
        }
    }, [onImageUploaded]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    };

    const handleRemove = () => {
        setPreview(null);
        setError('');
        onImageRemoved();
    };

    return (
        <div className="image-uploader">
            {!preview ? (
                /* ── Drop zone ────────────────────────── */
                <div
                    className={`image-uploader__dropzone ${isDragging ? 'image-uploader__dropzone--dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                    />
                    <div className="image-uploader__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                    <div className="image-uploader__text">
                        <p className="image-uploader__primary-text">
                            Kéo thả ảnh vào đây hoặc <span className="image-uploader__link">chọn file</span>
                        </p>
                        <p className="image-uploader__hint">PNG, JPG, GIF, WebP · Tối đa 5MB</p>
                    </div>
                </div>
            ) : (
                /* ── Preview ──────────────────────────── */
                <div className="image-uploader__preview">
                    <img
                        src={preview}
                        alt="Ảnh bìa cuộc bình chọn"
                        className="image-uploader__preview-img"
                    />

                    {/* Uploading overlay */}
                    {isUploading && (
                        <div className="image-uploader__uploading-overlay">
                            <div className="image-uploader__upload-info">
                                <div className="image-uploader__spinner" />
                                <span className="image-uploader__upload-text">Đang upload... {progress}%</span>
                            </div>
                            <div className="image-uploader__progress-track">
                                <div
                                    className="image-uploader__progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {!isUploading && (
                        <div className="image-uploader__actions">
                            <button
                                type="button"
                                className="image-uploader__change-btn"
                                onClick={() => inputRef.current?.click()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Thay đổi
                            </button>
                            <button
                                type="button"
                                className="image-uploader__remove-btn"
                                onClick={handleRemove}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Xóa
                            </button>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleInputChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                    )}

                    {/* Cloudinary badge */}
                    {!isUploading && preview.includes('cloudinary') && (
                        <div className="image-uploader__cloud-badge">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                                <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-11-5h-2v6H7l5 5 5-5h-4V7z" />
                            </svg>
                            Đã lưu trên Cloudinary
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="image-uploader__error">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};

export default ImageUploader;
