import { useState } from 'react';
import { projectAPI } from '../services/api';

const CreateProjectModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    deadline: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        requiredSkills: formData.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        deadline: formData.deadline,
      };
      await projectAPI.createProject(payload);
      onCreated(); // Refresh the feed
      onClose();   // Close the popup
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Post a Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
            <input name="title" required maxLength={100} className="input-field" placeholder="e.g., FYP - Campus Navigation App" onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (min 20 characters)</label>
            <textarea name="description" required minLength={20} rows={4} className="input-field" placeholder="Describe your project and the teammates you need..." onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma separated)</label>
            <input name="requiredSkills" required className="input-field" placeholder="e.g., React, Node.js, MongoDB" onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input name="deadline" type="date" required className="input-field" onChange={handleChange} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Posting...' : 'Publish Project'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;