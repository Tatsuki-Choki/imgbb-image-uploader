import type { ImgbbSuccessResponse, ImgbbErrorResponse } from '../types';

const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

export const uploadImage = async (imageFile: File, apiKey: string): Promise<string> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('ImgBB APIキーが設定されていません。');
  }

  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch(`${IMGBB_API_URL}?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      const errorResult = result as ImgbbErrorResponse;
      throw new Error(errorResult.error?.message || '不明なエラーにより画像のアップロードに失敗しました。');
    }

    const successResult = result as ImgbbSuccessResponse;
    return successResult.data.url;
  } catch (error) {
    if (error instanceof Error) {
        throw new Error(`アップロード失敗: ${error.message}`);
    }
    throw new Error('画像のアップロード中に予期せぬエラーが発生しました。');
  }
};

export const uploadMultipleImages = async (imageFiles: File[], apiKey: string): Promise<string[]> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('ImgBB APIキーが設定されていません。');
  }

  if (imageFiles.length === 0) {
    throw new Error('アップロードする画像がありません。');
  }

  if (imageFiles.length > 10) {
    throw new Error('一度にアップロードできる画像は10枚までです。');
  }

  try {
    const uploadPromises = imageFiles.map(file => uploadImage(file, apiKey));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`一括アップロード失敗: ${error.message}`);
    }
    throw new Error('画像の一括アップロード中に予期せぬエラーが発生しました。');
  }
};