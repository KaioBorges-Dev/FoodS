import React, { useState, useRef } from 'react';
import { uploadImageToSupabase } from '../lib/supabase';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ImageUploaderProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label = 'Imagem',
  value,
  onChange,
  folder = 'products',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Selecione apenas arquivos de imagem (JPG, PNG, WEBP).');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImageToSupabase(file, folder);
      onChange(url);
    } catch (err: any) {
      console.error('Erro ao fazer upload da imagem:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-1 text-xs font-sans">
      {label && <label className="font-bold text-slate-700 block">{label}</label>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {value ? (
        <div className="relative p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={value} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
            <div>
              <p className="font-bold text-slate-900 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Imagem Carregada</span>
              </p>
              <p className="text-[10px] text-slate-400">Armazenada no Supabase Storage</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Substituir</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
            isDragging
              ? 'border-amber-500 bg-amber-50'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-amber-400'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2 py-2">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-bold text-amber-600">Enviando imagem para o Supabase...</p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Arraste a imagem aqui</p>
                <p className="text-[11px] text-slate-400">ou clique para selecionar do computador</p>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">JPG • PNG • WEBP</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
