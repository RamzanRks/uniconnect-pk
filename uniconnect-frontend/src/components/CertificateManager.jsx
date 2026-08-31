import { useState, useEffect } from 'react';
import { certAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMPTY = { title: '', issuer: '', year: '', category: 'course', credentialUrl: '', featured: false };

const CertificateManager = ({ onClose }) => {
  const { user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const load = () => certAPI.get(user._id).then(({ data }) => setCerts(data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const startEdit = (c) => {
    setEditId(c._id);
    setForm({ title: c.title, issuer: c.issuer || '', year: c.year || '', category: c.category, credentialUrl: c.credentialUrl || '', featured: c.featured });
    setFile(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!editId && !file) { setError('Please upload the certificate file.'); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('cert', file);
    try {
      if (editId) await certAPI.update(editId, fd);
      else await certAPI.create(fd);
      setForm(EMPTY); setFile(null); setEditId(null);
      load();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">🏅 Manage Certificates ({certs.length}/20)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-2 gap-3 mb-6 bg-gray-50 p-4 rounded-lg">
          <p className="col-span-2 text-sm font-semibold text-gray-700">{editId ? '✏️ Editing certificate' : '➕ Add certificate'}</p>
          <input className="input-field col-span-2" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="input-field" placeholder="Issuer" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
          <input className="input-field" type="number" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="academic">🎓 Academic</option>
            <option value="course">📚 Course</option>
            <option value="hackathon">💻 Hackathon</option>
            <option value="achievement">🏆 Achievement</option>
          </select>
          <input className="input-field" placeholder="Credential URL" value={form.credentialUrl} onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })} />
          <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> 📌 Feature on top
          </label>
          <input className="input-field col-span-2" type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files[0])} />
          {error && <p className="col-span-2 text-xs text-red-600">{error}</p>}
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">{editId ? '💾 Save Changes' : '➕ Add Certificate'}</button>
            {editId && <button type="button" onClick={() => { setEditId(null); setForm(EMPTY); setFile(null); }} className="px-4 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>}
          </div>
        </form>

        <div className="space-y-2">
          {certs.map((c) => (
            <div key={c._id} className="flex justify-between items-center border border-gray-100 rounded p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.title} {c.featured && '📌'}</p>
                <p className="text-xs text-gray-400">{c.issuer} • {c.year || '—'} • {c.category}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(c)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">✏️ Edit</button>
                <button onClick={async () => { await certAPI.toggleFeatured(c._id); load(); }} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200">{c.featured ? 'Unpin' : '📌 Pin'}</button>
                <button onClick={async () => { if (window.confirm('Delete?')) { await certAPI.delete(c._id); load(); } }} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">🗑️</button>
              </div>
            </div>
          ))}
          {certs.length === 0 && <p className="text-sm text-gray-400 text-center">No certificates yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default CertificateManager;