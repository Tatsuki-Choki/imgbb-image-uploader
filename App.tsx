import React, { useState, useCallback, useEffect, useRef } from 'react';
import { uploadImage } from './services/imgbbService';

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
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('imgbbApiKey') || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Save API key to localStorage whenever it changes
    localStorage.setItem('imgbbApiKey', apiKey);
  }, [apiKey]);

  useEffect(() => {
    // Cleanup the object URL to avoid memory leaks
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageUrl(null);
    setError(null);
    setIsCopied(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('有効な画像ファイルを選択してください。');
        return;
      }
      resetState();
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    if (!apiKey.trim()) {
        setError('ImgBB APIキーを入力してください。');
        return;
    }

    setUploading(true);
    setError(null);
    setImageUrl(null);

    try {
      const url = await uploadImage(selectedFile, apiKey);
      setImageUrl(url);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setUploading(false);
    }
  }, [selectedFile, apiKey]);

  const handleCopy = useCallback(() => {
    if (!imageUrl || !navigator.clipboard) return;

    navigator.clipboard.writeText(imageUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  }, [imageUrl]);

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col items-center justify-center p-4 text-slate-800 font-sans">
        <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl shadow-blue-500/10">
            <div className="p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">画像URLアップローダー</h1>
                    <p className="text-gray-500 mt-2">画像をアップロードして共有リンクを即座に取得</p>
                </div>
                
                <div className="mb-6">
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">ImgBB APIキー</label>
                    <input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="APIキーを入力してください"
                        className="mt-1 w-full px-3 py-2 text-slate-800 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">APIキーはブラウザに保存されます。</p>
                </div>

                {!previewUrl && (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-300">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadIcon />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">クリックしてアップロード</span></p>
                            <p className="text-xs text-gray-400">またはドラッグ＆ドロップ</p>
                        </div>
                        <input ref={fileInputRef} id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                )}

                {previewUrl && (
                    <div className="mt-4 flex flex-col items-center gap-4">
                        <div className="w-full h-48 flex justify-center items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                            <img src={previewUrl} alt="プレビュー画像" className="object-contain max-h-full max-w-full" />
                        </div>
                         {!imageUrl && !uploading && (
                            <div className="flex w-full gap-2">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !apiKey}
                                    className="flex-grow items-center justify-center h-12 px-6 font-semibold text-white transition-all duration-300 bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    画像をアップロード
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
                
                {imageUrl && (
                    <div className="mt-6 space-y-3 animate-fade-in">
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">画像URL:</label>
                        <div className="flex gap-2">
                            <input
                                id="imageUrl"
                                type="text"
                                value={imageUrl}
                                readOnly
                                className="w-full px-3 py-2 text-slate-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleCopy}
                                className={`flex items-center justify-center w-28 h-10 px-4 font-semibold text-white transition-all duration-300 rounded-lg ${
                                    isCopied ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${isCopied ? 'focus:ring-green-500' : 'focus:ring-blue-500'}`}
                            >
                                {isCopied ? <CheckIcon /> : <CopyIcon />}
                                <span className="ml-2">{isCopied ? 'コピー完了' : 'コピー'}</span>
                            </button>
                        </div>
                        <button 
                            onClick={resetState}
                            className="w-full mt-2 text-sm text-blue-600 hover:text-blue-500 transition-colors"
                        >
                            別の画像をアップロード
                        </button>
                    </div>
                )}
            </div>
            <footer className="text-center text-xs text-gray-400 border-t border-gray-200 py-3">
                Powered by <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 underline">ImgBB</a>
            </footer>
        </div>
    </div>
  );
};

export default App;
