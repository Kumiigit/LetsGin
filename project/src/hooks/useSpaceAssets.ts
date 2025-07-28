import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SpaceAsset } from '../types';

export function useSpaceAssets(spaceId?: string) {
  const [assets, setAssets] = useState<SpaceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (spaceId) {
      loadAssets();
    } else {
      setLoading(false);
    }
  }, [spaceId]);

  const loadAssets = async () => {
    if (!spaceId) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('space_assets')
        .select('*')
        .eq('space_id', spaceId);

      if (error) throw error;

      const convertedAssets: SpaceAsset[] = (data || []).map(asset => ({
        id: asset.id,
        spaceId: asset.space_id,
        assetType: asset.asset_type,
        fileName: asset.file_name,
        filePath: asset.file_path,
        fileSize: asset.file_size,
        mimeType: asset.mime_type,
        uploadedBy: asset.uploaded_by,
        createdAt: asset.created_at,
        updatedAt: asset.updated_at,
      }));

      setAssets(convertedAssets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const uploadAsset = async (
    file: File,
    assetType: 'logo' | 'banner'
  ): Promise<SpaceAsset> => {
    if (!spaceId) throw new Error('No space selected');

    // Validate file
    const maxSize = assetType === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for logo, 5MB for banner
    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File must be PNG, JPG, or SVG format');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${assetType}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${spaceId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('space-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Save asset record to database
      const { data: assetData, error: dbError } = await supabase
        .from('space_assets')
        .upsert({
          space_id: spaceId,
          asset_type: assetType,
          file_name: fileName,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const newAsset: SpaceAsset = {
        id: assetData.id,
        spaceId: assetData.space_id,
        assetType: assetData.asset_type,
        fileName: assetData.file_name,
        filePath: assetData.file_path,
        fileSize: assetData.file_size,
        mimeType: assetData.mime_type,
        uploadedBy: assetData.uploaded_by,
        createdAt: assetData.created_at,
        updatedAt: assetData.updated_at,
      };

      await loadAssets();
      return newAsset;
    } catch (err) {
      throw err;
    }
  };

  const deleteAsset = async (assetId: string) => {
    try {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) throw new Error('Asset not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('space-assets')
        .remove([asset.filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('space_assets')
        .delete()
        .eq('id', assetId);

      if (dbError) throw dbError;

      await loadAssets();
    } catch (err) {
      throw err;
    }
  };

  const getAssetUrl = (asset: SpaceAsset): string => {
    const { data } = supabase.storage
      .from('space-assets')
      .getPublicUrl(asset.filePath);
    
    return data.publicUrl;
  };

  const getAssetByType = (type: 'logo' | 'banner'): SpaceAsset | undefined => {
    return assets.find(asset => asset.assetType === type);
  };

  return {
    assets,
    loading,
    error,
    uploadAsset,
    deleteAsset,
    getAssetUrl,
    getAssetByType,
    refreshAssets: loadAssets,
  };
}