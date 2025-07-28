import React, { useState, useRef } from 'react';
import { X, Upload, Image, Trash2, Check, AlertCircle } from 'lucide-react';
import { Space, SpaceAsset } from '../types';
import { useSpaceAssets } from '../hooks/useSpaceAssets';

interface SpaceBrandingModalProps {
  space: Space;
  onClose: () => void;
}

export const SpaceBrandingModal: React.FC<SpaceBrandingModalProps> = ({
  space,
  onClose,
}) => {
  const { assets, loading, uploadAsset, deleteAsset, getAssetUrl, getAssetByType } = useSpaceAssets(space.id);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const logoAsset = getAssetByType('logo');
  const bannerAsset = getAssetByType('banner');

  const handleFileUpload = async (file: File, type: 'logo' | 'banner') => {
    setUploading(type);
    setUploadError(null);

    try {
      await uploadAsset(file, type);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
    // Reset input
    event.target.value = '';
  };

  const handleDelete = async (asset: SpaceAsset) => {
    if (confirm(`Are you sure you want to delete this ${asset.assetType}?`)) {
      try {
        await deleteAsset(asset.id);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Delete failed');
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="professional-card rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Image className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Space Branding</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {uploadError && (
            <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{uploadError}</span>
            </div>
          )}

          {/* Logo Section */}
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium text-white mb-2">Space Logo</h4>
              <p className="text-sm text-gray-400">
                Recommended: 200x200px, max 2MB, formats: PNG, JPG, SVG
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Preview */}
              <div className="space-y-4">
                <div className="aspect-square professional-card border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {logoAsset ? (
                    <img
                      src={getAssetUrl(logoAsset)}
                      alt="Space Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Image className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No logo uploaded</p>
                    </div>
                  )}
                </div>

                {logoAsset && (
                  <div className="professional-card rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Current Logo</span>
                      <button
                        onClick={() => handleDelete(logoAsset)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>File: {logoAsset.fileName}</div>
                      <div>Size: {formatFileSize(logoAsset.fileSize)}</div>
                      <div>Type: {logoAsset.mimeType}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Logo Upload */}
              <div className="space-y-4">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading === 'logo'}
                  className="professional-button w-full p-6 border-2 border-dashed border-gray-700 rounded-lg hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-center">
                    {uploading === 'logo' ? (
                      <div className="space-y-2">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-blue-400">Uploading...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-white font-medium">
                          {logoAsset ? 'Replace Logo' : 'Upload Logo'}
                        </p>
                        <p className="text-sm text-gray-400">
                          Click to select file
                        </p>
                      </div>
                    )}
                  </div>
                </button>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={(e) => handleFileSelect(e, 'logo')}
                  className="hidden"
                />

                <div className="text-xs text-gray-500 space-y-1">
                  <div>• Maximum file size: 2MB</div>
                  <div>• Supported formats: PNG, JPG, SVG</div>
                  <div>• Recommended size: 200x200px</div>
                  <div>• Square aspect ratio works best</div>
                </div>
              </div>
            </div>
          </div>

          {/* Banner Section */}
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium text-white mb-2">Space Banner</h4>
              <p className="text-sm text-gray-400">
                Recommended: 1200x400px, max 5MB, formats: PNG, JPG
              </p>
            </div>

            <div className="space-y-4">
              {/* Banner Preview */}
              <div className="aspect-[3/1] professional-card border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                {bannerAsset ? (
                  <img
                    src={getAssetUrl(bannerAsset)}
                    alt="Space Banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Image className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No banner uploaded</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Banner Upload */}
                <div className="space-y-4">
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploading === 'banner'}
                    className="professional-button w-full p-6 border-2 border-dashed border-gray-700 rounded-lg hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-center">
                      {uploading === 'banner' ? (
                        <div className="space-y-2">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-blue-400">Uploading...</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                          <p className="text-white font-medium">
                            {bannerAsset ? 'Replace Banner' : 'Upload Banner'}
                          </p>
                          <p className="text-sm text-gray-400">
                            Click to select file
                          </p>
                        </div>
                      )}
                    </div>
                  </button>

                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => handleFileSelect(e, 'banner')}
                    className="hidden"
                  />

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>• Maximum file size: 5MB</div>
                    <div>• Supported formats: PNG, JPG</div>
                    <div>• Recommended size: 1200x400px</div>
                    <div>• 3:1 aspect ratio works best</div>
                  </div>
                </div>

                {/* Banner Info */}
                {bannerAsset && (
                  <div className="professional-card rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Current Banner</span>
                      <button
                        onClick={() => handleDelete(bannerAsset)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>File: {bannerAsset.fileName}</div>
                      <div>Size: {formatFileSize(bannerAsset.fileSize)}</div>
                      <div>Type: {bannerAsset.mimeType}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="professional-button px-6 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};