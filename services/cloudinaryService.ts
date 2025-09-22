import type { CloudinarySuccessResponse, CloudinaryErrorResponse } from '../types';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1';

export const uploadImageToCloudinary = async (
  imageFile: File, 
  cloudName: string, 
  uploadPreset: string
): Promise<string> => {
  if (!cloudName || cloudName.trim() === '') {
    throw new Error('Cloudinary Cloud Nameが設定されていません。');
  }

  if (!uploadPreset || uploadPreset.trim() === '') {
    throw new Error('Cloudinary Upload Presetが設定されていません。');
  }

  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`${CLOUDINARY_UPLOAD_URL}/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      const errorResult = result as CloudinaryErrorResponse;
      throw new Error(errorResult.error?.message || '不明なエラーにより画像のアップロードに失敗しました。');
    }

    const successResult = result as CloudinarySuccessResponse;
    return successResult.secure_url;
  } catch (error) {
    if (error instanceof Error) {
        throw new Error(`アップロード失敗: ${error.message}`);
    }
    throw new Error('画像のアップロード中に予期せぬエラーが発生しました。');
  }
};

export const uploadMultipleImagesToCloudinary = async (
  imageFiles: File[], 
  cloudName: string, 
  uploadPreset: string
): Promise<string[]> => {
  if (!cloudName || cloudName.trim() === '') {
    throw new Error('Cloudinary Cloud Nameが設定されていません。');
  }

  if (!uploadPreset || uploadPreset.trim() === '') {
    throw new Error('Cloudinary Upload Presetが設定されていません。');
  }

  if (imageFiles.length === 0) {
    throw new Error('アップロードする画像がありません。');
  }

  if (imageFiles.length > 10) {
    throw new Error('一度にアップロードできる画像は10枚までです。');
  }

  try {
    const uploadPromises = imageFiles.map(file => uploadImageToCloudinary(file, cloudName, uploadPreset));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`一括アップロード失敗: ${error.message}`);
    }
    throw new Error('画像の一括アップロード中に予期せぬエラーが発生しました。');
  }
};
