import { useState, useEffect } from 'react';
import { bookmarkAPI } from '../services/api';

const SavedPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookmarkAPI.get()
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">★ Saved Items</h1>

      {loading ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-center">Nothing saved yet. Tap the ☆ on any project or question.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((b) => (
            <div key={b._id} className="bg-white p-5 rounded-lg shadow">
              <p className="text-xs text-gray-400 uppercase">
                {b.targetType === 'ProjectPost' ? '📌 Project' : '💡 Question'}
              </p>
              <p className="font-semibold text-gray-900 mt-1">{b.targetId?.title || 'Removed item'}</p>
              {b.targetId?.description && (
                <p className="text-sm text-gray-600 mt-1">{b.targetId.description}</p>
              )}
              {b.targetId?.content && (
                <p className="text-sm text-gray-600 mt-1">{b.targetId.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPage;