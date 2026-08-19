import { useState, useEffect, useCallback } from 'react';
import { qaAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';

const QAPage = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [reportQuestionId, setReportQuestionId] = useState(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const fetchQuestions = useCallback(async () => {
    try {
      const { data } = await qaAPI.getQuestions();
      setQuestions(data.questions);
    } catch (err) {
      console.error('Failed to load questions', err);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    try {
      await qaAPI.createQuestion({ title, content, tags });
      setTitle(''); setContent(''); setTags('');
      setShowForm(false);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post');
    }
  };

  const handleSelectQuestion = async (q) => {
    setSelectedQuestion(q);
    try {
      const { data } = await qaAPI.getQuestionDetail(q._id);
      setSelectedQuestion(data.question);
      setAnswers(data.answers);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshDetail = async (id) => {
    const { data } = await qaAPI.getQuestionDetail(id);
    setSelectedQuestion(data.question);
    setAnswers(data.answers);
  };

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;
    try {
      await qaAPI.postAnswer(selectedQuestion._id, { content: newAnswer });
      setNewAnswer('');
      await refreshDetail(selectedQuestion._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post answer');
    }
  };

  const handleAccept = async (answerId) => {
    try {
      await qaAPI.acceptAnswer(answerId);
      await refreshDetail(selectedQuestion._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept answer');
    }
  };

  const isAuthor = user && selectedQuestion?.author && user._id === selectedQuestion.author._id;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💡 Student Q&A</h1>
          <p className="text-sm text-gray-500">Ask for help, share knowledge, solve problems.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          {showForm ? 'Cancel' : '+ Ask Question'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAskQuestion} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4 border border-blue-100">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Question Title" required className="input-field" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Describe your problem in detail (min 20 chars)..." required minLength={20} rows={4} className="input-field" />
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (e.g. React, Node, comma separated)" className="input-field" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Post Question</button>
        </form>
      )}

      {!selectedQuestion ? (
        <div className="grid gap-4">
          {questions.length === 0 ? (
            <p className="text-gray-500 text-center">No questions yet. Be the first to ask!</p>
          ) : (
            questions.map((q) => (
              <div key={q._id} onClick={() => handleSelectQuestion(q)} className="bg-white p-5 rounded-lg shadow border border-gray-100 hover:border-blue-300 hover:shadow-md transition cursor-pointer">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-blue-700">{q.title}</h3>
                  {q.isResolved && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">✅ Solved</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{q.content}</p>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-2">
                    {q.tags.map((tag, i) => (
                      <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{tag}</span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">By {q.author?.firstName} • {new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => setSelectedQuestion(null)} className="text-blue-600 text-sm mb-4 hover:underline">← Back to all questions</button>

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-gray-900">{selectedQuestion.title}</h2>
              <button
                onClick={() => setReportQuestionId(selectedQuestion._id)}
                title="Report this question"
                className="text-gray-400 hover:text-red-600 transition text-lg"
              >
                🚩
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Asked by {selectedQuestion.author?.firstName} {selectedQuestion.author?.lastName}</p>
            <p className="text-gray-800 whitespace-pre-line">{selectedQuestion.content}</p>
          </div>

          <h3 className="text-lg font-bold text-gray-800 mb-3">{answers.length} Answers</h3>
          <div className="space-y-4 mb-6">
            {answers.map((a) => (
              <div key={a._id} className={`p-4 rounded-lg border ${a.isAccepted ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                {a.isAccepted && (
                  <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full mb-2 inline-block">✅ Accepted Solution</span>
                )}
                <p className="text-gray-800">{a.content}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Answered by {a.author?.firstName} • {new Date(a.createdAt).toLocaleString()}
                  </p>
                  {isAuthor && !a.isAccepted && (
                    <button
                      onClick={() => handleAccept(a._id)}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                    >
                      Mark as Accepted
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handlePostAnswer} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-2">Your Answer</h4>
            <textarea value={newAnswer} onChange={e => setNewAnswer(e.target.value)} placeholder="Share your solution or advice..." required minLength={10} rows={3} className="input-field mb-3" />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">Post Answer</button>
          </form>
        </div>
      )}

      {reportQuestionId && (
        <ReportModal
          onSubmit={(data) => qaAPI.reportQuestion(reportQuestionId, data)}
          onClose={() => setReportQuestionId(null)}
          onReported={fetchQuestions}
        />
      )}
    </div>
  );
};

export default QAPage;