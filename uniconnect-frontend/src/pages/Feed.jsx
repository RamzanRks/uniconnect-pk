import { useState, useEffect, useCallback } from 'react';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreateProjectModal from '../components/CreateProjectModal';
import ReportModal from '../components/ReportModal';
import ApplyModal from '../components/ApplyModal';
import ApplicantsModal from '../components/ApplicantsModal';
import { Link } from 'react-router-dom';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [applyPostId, setApplyPostId] = useState(null);
  const [applicantsPostId, setApplicantsPostId] = useState(null);

  const [options, setOptions] = useState({ skills: [], universities: [] });
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ search: '', skill: 'all', university: 'all' });

  // Load filter dropdown options
  useEffect(() => {
    projectAPI.getFilterOptions()
      .then(({ data }) => setOptions(data))
      .catch(() => {});
  }, []);

  // Debounce search input (waits 400ms after typing stops)
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput.trim() }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPosts = useCallback(async () => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.skill !== 'all') params.skill = filters.skill;
      if (filters.university !== 'all') params.university = filters.university;

      const { data } = await projectAPI.getProjects(params);
      setPosts(data.posts);
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  }, [filters]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ search: '', skill: 'all', university: 'all' });
  };

  const isOwner = (post) => user && post.creator && user._id === post.creator._id;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Project Board</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Post Project
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="🔍 Search projects..."
          className="input-field"
        />
        <select
          value={filters.skill}
          onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
          className="input-field"
        >
          <option value="all">All Skills</option>
          {options.skills.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.university}
          onChange={(e) => setFilters({ ...filters, university: e.target.value })}
          className="input-field"
        >
          <option value="all">All Universities</option>
          {options.universities.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <button
          onClick={clearFilters}
          className="text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
        >
          Clear Filters
        </button>
      </div>

      <div className="grid gap-6">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center">No projects match your search. Try clearing filters.</p>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white p-6 rounded-lg shadow border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                     <p className="text-sm text-gray-500">
                    Posted by{' '}
                    <Link to={`/user/${post.creator?._id}`} className="font-medium text-blue-600 hover:underline">
                      {post.creator?.firstName} {post.creator?.lastName}
                    </Link>{' '}
                    • {post.creator?.university}
                    {post.creator?.verificationStatus === 'verified' && ' ✅'}
                  </p>
                
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Open</span>
                  <button
                    onClick={() => setReportPostId(post._id)}
                    title="Report this post"
                    className="text-gray-400 hover:text-red-600 transition text-lg"
                  >
                    🚩
                  </button>
                </div>
              </div>

              <p className="mt-3 text-gray-700">{post.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {post.requiredSkills.map((skill, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-gray-400">
                  Deadline: {new Date(post.deadline).toLocaleDateString()}
                </p>
                {isOwner(post) ? (
                  <button
                    onClick={() => setApplicantsPostId(post._id)}
                    className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-black transition"
                  >
                    👥 View Applicants
                  </button>
                ) : (
                  <button
                    onClick={() => setApplyPostId(post._id)}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition"
                  >
                    🤝 Apply to Join
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <CreateProjectModal onClose={() => setShowModal(false)} onCreated={fetchPosts} />
      )}
      {reportPostId && (
        <ReportModal
          onSubmit={(data) => projectAPI.reportProject(reportPostId, data)}
          onClose={() => setReportPostId(null)}
          onReported={fetchPosts}
        />
      )}
      {applyPostId && (
        <ApplyModal
          projectId={applyPostId}
          onClose={() => setApplyPostId(null)}
          onApplied={fetchPosts}
        />
      )}
      {applicantsPostId && (
        <ApplicantsModal
          projectId={applicantsPostId}
          onClose={() => setApplicantsPostId(null)}
        />
      )}
    </div>
  );
};

export default Feed;