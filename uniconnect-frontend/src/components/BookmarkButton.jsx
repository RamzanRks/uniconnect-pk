import { useState, useEffect } from 'react';
import { bookmarkAPI } from '../services/api';

const BookmarkButton = ({ type, id }) => {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    bookmarkAPI.get()
      .then(({ data }) => {
        setSaved(data.some((b) => (b.targetId?._id || b.targetId) === id));
      })
      .catch(() => {});
  }, [id]);

  const toggle = async () => {
    try {
      const { data } = await bookmarkAPI.toggle(type, id);
      setSaved(data.bookmarked);
    } catch (e) { /* ignore */ }
  };

  return (
    <button
      onClick={toggle}
      title={saved ? 'Remove from saved' : 'Save for later'}
      className={`text-lg transition ${saved ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
    >
      {saved ? '★' : '☆'}
    </button>
  );
};

export default BookmarkButton;