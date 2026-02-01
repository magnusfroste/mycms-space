import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp',
};

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  try {
    const compressionOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    const compressedFile = await imageCompression(file, compressionOptions);
    
    console.log(
      `Compressed: ${compressedFile.name} (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB) - ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% reduction`
    );

    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
};

export const compressMultipleImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> => {
  return Promise.all(files.map(file => compressImage(file, options)));
};
