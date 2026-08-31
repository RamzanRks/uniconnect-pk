import { useState, useEffect, useRef } from 'react';
import { fileAPI, SERVER_URL } from '../services/api';

const FileVault = ({ projectId, canUpload }) => {
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);

  const load = () => fileAPI.get(projectId).then(({ data }) => setFiles(data)).catch(() => {});
  useEffect(() => { load(); }, [projectId]);

  const upload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    try { await fileAPI.upload(projectId, fd); load(); }
    catch (err) { alert(err.response?.data?.message || 'Upload failed'); }
    e.target.value = '';
  };

  const del = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try { await fileAPI.delete(id); load(); } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const fmt = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">📁 File Vault ({files.length}/10)</h3>
        {canUpload && (
          <>
            <button onClick={() => inputRef.current?.click()} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">⬆️ Upload (max 5MB)</button>
            <input type="file" ref={inputRef} onChange={upload} className="hidden" />
          </>
        )}
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-gray-500">No files shared yet.</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f._id} className="flex justify-between items-center border border-gray-100 rounded p-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl">📄</span>
                <div className="min-w-0">
                  <a href={f.url.startsWith('http') ? f.url : `${SERVER_URL}${f.url}`} download={f.name} className="text-sm font-medium text-blue-600 hover:underline truncate block">{f.name}</a>
                  <p className="text-xs text-gray-400">{fmt(f.size)} • by {f.uploader?.firstName} {f.uploader?.lastName}</p>
                </div>
              </div>
              {canUpload && <button onClick={() => del(f._id)} className="text-xs text-red-600 hover:underline">Delete</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileVault;