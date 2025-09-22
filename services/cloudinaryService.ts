import type { CloudinarySuccessResponse, CloudinaryErrorResponse } from '../types';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1';

// 署名を生成する関数
const generateSignature = async (timestamp: number, apiSecret: string): Promise<string> => {
  const message = `timestamp=${timestamp}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const uploadImageToCloudinary = async (
  imageFile: File, 
  cloudName: string, 
  apiKey: string,
  apiSecret: string
): Promise<string> => {
  if (!cloudName || cloudName.trim() === '') {
    throw new Error('Cloudinary Cloud Nameが設定されていません。');
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Cloudinary API Keyが設定されていません。');
  }

  if (!apiSecret || apiSecret.trim() === '') {
    throw new Error('Cloudinary API Secretが設定されていません。');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = await generateSignature(timestamp, apiSecret);

  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

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
  apiKey: string,
  apiSecret: string
): Promise<string[]> => {
  if (!cloudName || cloudName.trim() === '') {
    throw new Error('Cloudinary Cloud Nameが設定されていません。');
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Cloudinary API Keyが設定されていません。');
  }

  if (!apiSecret || apiSecret.trim() === '') {
    throw new Error('Cloudinary API Secretが設定されていません。');
  }

  if (imageFiles.length === 0) {
    throw new Error('アップロードする画像がありません。');
  }

  if (imageFiles.length > 10) {
    throw new Error('一度にアップロードできる画像は10枚までです。');
  }

  try {
    const uploadPromises = imageFiles.map(file => uploadImageToCloudinary(file, cloudName, apiKey, apiSecret));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`一括アップロード失敗: ${error.message}`);
    }
    throw new Error('画像の一括アップロード中に予期せぬエラーが発生しました。');
  }
};
