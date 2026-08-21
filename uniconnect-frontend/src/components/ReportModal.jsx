import { useState } from 'react';

const REASONS = [
  'Spam', 'Harassment', 'Bullying', 'Hate Speech', 'Sexual Content',
  'Nudity', 'Violence', 'Threats', 'Fake Profile', 'Impersonation',
  'Misinformation', 'Plagiarism', 'Copyright Violation', 'Fraud or Scam',
  'Self-Harm', 'Drug Promotion', 'Privacy Violation', 'Inappropriate DP',
  'Offensive Username', 'Other',
];

const AREAS = [
  { value: 'dp', label: '📷 Profile Picture (DP)' },
  { value: 'profile_info', label: '📝 Profile Info / Bio / Username' },
  { value: 'other', label: '❓ Other' },
];

const ReportModal = ({ onSubmit, onClose, onReported, showArea = false }) => {
  const [reason, setReason] = useState(REASONS[0]);
  const [area, setArea] = useState('dp');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        reason,
        details,
        ...(showArea ? { targetArea: area } : {}),
      });
      if (onReported) onReported();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">🚩 Report</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {showArea && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What are you reporting?</label>
              <select value={area} onChange={(e) => setArea(e.target.value)} className="input-field">
                {AREAS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="input-field">
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details (optional)</label>
            <textarea rows={3} className="input-field" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Explain what's wrong..." />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;