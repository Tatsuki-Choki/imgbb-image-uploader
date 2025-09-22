import React, { useState, useCallback, useEffect, useRef } from 'react';
import { uploadImageToCloudinary, uploadMultipleImagesToCloudinary } from './services/cloudinaryService';

// --- Icon Components (defined outside App to prevent re-creation on re-renders) ---

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-10 h-10 text-blue-500"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

const Spinner: React.FC = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-blue-500"></div>
);

// --- Main App Component ---

const App: React.FC = () => {
  // 環境変数からCloudinary認証情報を取得
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '';
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || '';
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'multiple'>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 環境変数の設定チェック
  useEffect(() => {
    if (!cloudName || !apiKey || !apiSecret) {
      setError('環境変数が設定されていません。.envファイルでVITE_CLOUDINARY_CLOUD_NAME、VITE_CLOUDINARY_API_KEY、VITE_CLOUDINARY_API_SECRETを設定してください。');
    }
  }, [cloudName, apiKey, apiSecret]);

  useEffect(() => {
    // Cleanup the object URLs to avoid memory leaks
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const resetState = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setImageUrls([]);
    setError(null);
    setIsCopied(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // 画像ファイルかチェック
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('有効な画像ファイルを選択してください。');
      return;
    }

    // 複数ファイルの上限チェック
    if (uploadMode === 'multiple' && files.length > 10) {
      setError('一度にアップロードできる画像は10枚までです。');
      return;
    }

    resetState();
    
    if (uploadMode === 'single') {
      const file = files[0];
      setSelectedFiles([file]);
      setPreviewUrls([URL.createObjectURL(file)]);
    } else {
      setSelectedFiles(files);
      setPreviewUrls(files.map(file => URL.createObjectURL(file)));
    }
  };

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    // 環境変数の設定チェック
    if (!cloudName || !apiKey || !apiSecret) {
      setError('環境変数が設定されていません。.envファイルでVITE_CLOUDINARY_CLOUD_NAME、VITE_CLOUDINARY_API_KEY、VITE_CLOUDINARY_API_SECRETを設定してください。');
      return;
    }

    setUploading(true);
    setError(null);
    setImageUrls([]);

    try {
      if (uploadMode === 'single') {
        const url = await uploadImageToCloudinary(selectedFiles[0], cloudName, apiKey, apiSecret);
        setImageUrls([url]);
      } else {
        const urls = await uploadMultipleImagesToCloudinary(selectedFiles, cloudName, apiKey, apiSecret);
        setImageUrls(urls);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, cloudName, apiKey, apiSecret, uploadMode]);

  const handleCopy = useCallback((url: string) => {
    if (!url || !navigator.clipboard) return;

    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  }, []);

  const handleCopyAll = useCallback(() => {
    if (imageUrls.length === 0 || !navigator.clipboard) return;

    const allUrls = imageUrls.join('\n');
    navigator.clipboard.writeText(allUrls).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  }, [imageUrls]);

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col items-center justify-center p-4 text-slate-800 font-sans">
        <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl shadow-blue-500/10">
            <div className="p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">Cloudinary画像アップローダー</h1>
                    <p className="text-gray-500 mt-2">画像をCloudinaryにアップロードして共有リンクを即座に取得</p>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">環境変数の設定</h3>
                    <p className="text-xs text-blue-600 mb-2">
                        以下の環境変数を.envファイルに設定してください：
                    </p>
                    <div className="text-xs text-blue-600 space-y-1 font-mono">
                        <div>• VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name</div>
                        <div>• VITE_CLOUDINARY_API_KEY=your_api_key</div>
                        <div>• VITE_CLOUDINARY_API_SECRET=your_api_secret</div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                        環境変数名は小文字、数字、ダッシュ、アンダースコアのみ使用可能です。
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        <a href="https://cloudinary.com/" target="_blank" rel="noopener noreferrer" className="underline">
                            Cloudinaryアカウントの作成はこちら
                        </a>
                    </p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">アップロードモード</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setUploadMode('single');
                                resetState();
                            }}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                uploadMode === 'single'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            単一画像
                        </button>
                        <button
                            onClick={() => {
                                setUploadMode('multiple');
                                resetState();
                            }}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                uploadMode === 'multiple'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            複数画像（最大10枚）
                        </button>
                    </div>
                </div>

                {previewUrls.length === 0 && (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-300">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadIcon />
                            <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">
                                    {uploadMode === 'single' ? 'クリックして画像を選択' : 'クリックして画像を選択（最大10枚）'}
                                </span>
                            </p>
                            <p className="text-xs text-gray-400">またはドラッグ＆ドロップ</p>
                        </div>
                        <input 
                            ref={fileInputRef} 
                            id="dropzone-file" 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            multiple={uploadMode === 'multiple'}
                            onChange={handleFileChange} 
                        />
                    </label>
                )}

                {previewUrls.length > 0 && (
                    <div className="mt-4 flex flex-col items-center gap-4">
                        <div className="w-full">
                            {uploadMode === 'single' ? (
                                <div className="w-full h-48 flex justify-center items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                    <img src={previewUrls[0]} alt="プレビュー画像" className="object-contain max-h-full max-w-full" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="w-full h-24 flex justify-center items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                            <img src={url} alt={`プレビュー画像 ${index + 1}`} className="object-contain max-h-full max-w-full" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                         {imageUrls.length === 0 && !uploading && (
                            <div className="flex w-full gap-2">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !apiKey}
                                    className="flex-grow items-center justify-center h-12 px-6 font-semibold text-white transition-all duration-300 bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadMode === 'single' ? '画像をアップロード' : `${selectedFiles.length}枚の画像をアップロード`}
                                </button>
                                <button 
                                    onClick={resetState}
                                    className="h-12 px-4 font-semibold text-gray-700 transition-colors duration-300 bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                    キャンセル
                                </button>
                            </div>
                         )}
                    </div>
                )}
                
                {uploading && (
                    <div className="mt-6 flex flex-col items-center justify-center gap-3">
                        <Spinner />
                        <p className="text-gray-500">アップロード中です…</p>
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-center text-red-600 text-sm">
                        {error}
                    </div>
                )}
                
                {imageUrls.length > 0 && (
                    <div className="mt-6 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                                {uploadMode === 'single' ? '画像URL:' : `画像URL (${imageUrls.length}枚):`}
                            </label>
                            {uploadMode === 'multiple' && (
                                <button
                                    onClick={handleCopyAll}
                                    className={`flex items-center gap-1 px-3 py-1 text-xs font-medium text-white transition-all duration-300 rounded ${
                                        isCopied ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'
                                    }`}
                                >
                                    {isCopied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                                    {isCopied ? '全てコピー完了' : '全てコピー'}
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {imageUrls.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={url}
                                        readOnly
                                        className="flex-1 px-3 py-2 text-xs text-slate-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() => handleCopy(url)}
                                        className={`flex items-center justify-center w-16 h-8 px-2 text-xs font-semibold text-white transition-all duration-300 rounded ${
                                            isCopied ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'
                                        }`}
                                    >
                                        {isCopied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={resetState}
                            className="w-full mt-2 text-sm text-blue-600 hover:text-blue-500 transition-colors"
                        >
                            {uploadMode === 'single' ? '別の画像をアップロード' : '別の画像をアップロード'}
                        </button>
                    </div>
                )}
            </div>
            <footer className="text-center text-xs text-gray-400 border-t border-gray-200 py-3">
                Powered by{' '}
                <a href="https://cloudinary.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 underline">Cloudinary</a>
            </footer>
        </div>
    </div>
  );
};

export default App;
