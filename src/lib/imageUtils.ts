import imageCompression from 'browser-image-compression';

export async function compressImage(file: File) {
  // If it's not an image, return original file
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const options = {
    maxSizeMB: 1, // Max size 1MB
    maxWidthOrHeight: 1920, // Max dimension 1920px
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    
    // Return the compressed file as a File object (it returns a Blob/File)
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Image compression error:", error);
    return file; // Return original if compression fails
  }
}
