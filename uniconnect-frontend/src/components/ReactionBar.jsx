import { useState, useEffect } from 'react';
import { reactionAPI } from '../services/api';

const EMOJIS = ['👍', '❤️', '🎉', '', '🔥'];

const ReactionBar = ({ type, id }) => {
  const [counts, setCounts] = useState({});
  const [mine, setMine] = useState([]);

  useEffect(() => {
    reactionAPI.get(type, id)
      .then(({ data }) => { setCounts(data.counts); setMine(data.mine); })
      .catch(() => {});
  }, [type, id]);

  const toggle = async (emoji) => {
    try {
      const { data } = await reactionAPI.toggle(type, id, emoji);
      setCounts(data.counts);
      setMine(data.mine);
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="flex gap-2 mt-3">
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => toggle(e)}
          className={`text-sm px-2 py-1 rounded-full border transition ${
            mine.includes(e)
              ? 'bg-blue-100 border-blue-400'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}
        >
          {e} {counts[e] || ''}
        </button>
      ))}
    </div>
  );
};

export default ReactionBar;