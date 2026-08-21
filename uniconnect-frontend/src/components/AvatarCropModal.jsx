import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AvatarCropModal = ({ onClose }) => {
  const { refreshUser } = useAuth();
  const [img, setImg] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setImg(reader.result);
  };

  const onCropComplete = useCallback((_, area) => {
    setCroppedArea(area);
  }, []);

  const handleSet = async () => {
    if (!img || !croppedArea) return;
    setLoading(true);
    setError('');
    try {
      const blob = await getCroppedImg(img, croppedArea);
      const fd = new FormData();
      fd.append('avatar', blob, 'avatar.jpg');
      await profileAPI.setAvatar(fd);
      await refreshUser();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">📷 Set Profile Picture</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm mb-4">{error}</div>}

        {!img ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-600 mb-3">Choose a photo to crop</p>
            <input type="file" accept="image/*" onChange={onFile} className="block text-sm text-gray-600 mx-auto" />
          </div>
        ) : (
          <>
            <div className="relative h-64 bg-gray-900 rounded-lg overflow-hidden">
              <Cropper
                image={img}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-600">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setImg(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 transition">
                Choose Different
              </button>
              <button onClick={handleSet} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50">
                {loading ? 'Saving...' : '✅ Set as DP'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AvatarCropModal;