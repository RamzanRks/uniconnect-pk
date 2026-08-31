import { useState, useEffect } from 'react';
import { certAPI, SERVER_URL } from '../services/api';

const CATS = { all: '🌐 All', academic: '🎓 Academic', course: '📚 Course', hackathon: '💻 Hackathon', achievement: '🏆 Achievement' };

const CertificateTimeline = ({ userId }) => {
  const [certs, setCerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { certAPI.get(userId).then(({ data }) => setCerts(data)).catch(() => {}); }, [userId]);

  const shown = certs.filter((c) => filter === 'all' || c.category === filter);
  if (certs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow p-6 mt-6">
      <h3 className="font-bold text-gray-800 mb-3 text-lg">🏅 Certificates & Achievements ({certs.length})</h3>
      <div className="flex gap-2 flex-wrap mb-6">
        {Object.entries(CATS).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`text-xs px-3 py-1.5 rounded-full transition ${filter === k ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{label}</button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 rounded bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500" />
        {shown.map((c, i) => (
          <div key={c._id} className={`relative flex mb-8 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <span className="absolute left-1/2 -translate-x-1/2 top-3 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ring-4 ring-white shadow-lg z-10" />
            <div className={`w-[45%] ${i % 2 === 0 ? 'pr-4 text-right' : 'pl-4 text-left'}`}>
              <span className="inline-block text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-0.5 rounded-full mb-1">{c.year || '—'}</span>
              <div className={`rounded-xl border p-4 transition hover:shadow-xl hover:-translate-y-1 ${c.featured ? 'border-yellow-300 bg-yellow-50 shadow-md' : 'border-gray-100 bg-gray-50'}`}>
                <p className="text-sm font-semibold text-gray-900">{CATS[c.category]?.split(' ')[0]} {c.title} {c.featured && '📌'}</p>
                <p className="text-xs text-gray-500 mt-1">{c.issuer}</p>
                <div className={`flex gap-2 mt-2 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <button onClick={() => setLightbox(c)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">🔍 View</button>
                  {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">🔗 Proof</a>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="text-sm text-gray-400 text-center">No certificates in this category.</p>}
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.url.startsWith('http') ? lightbox.url : `${SERVER_URL}${lightbox.url}`} className="rounded-lg max-h-[80vh] w-full object-contain bg-white" />
            <div className="flex justify-between items-center mt-3">
              <p className="text-white text-sm font-medium">{lightbox.title}</p>
              <button onClick={() => setLightbox(null)} className="text-white text-2xl">&times;</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateTimeline;