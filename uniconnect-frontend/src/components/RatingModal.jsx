import { useState } from 'react';
import { ratingAPI } from '../services/api';

const RatingModal = ({ ratee, project, onClose, onRated }) => {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await ratingAPI.create({ ratee, project, stars, comment });
      if (onRated) onRated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">⭐ Rate Teammate</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm mb-4">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                className={`text-3xl transition ${n <= stars ? 'grayscale-0' : 'grayscale opacity-40'}`}
              >
                ⭐
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="input-field"
            placeholder="Optional comment about working with them..."
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
            Submit Rating
          </button>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;