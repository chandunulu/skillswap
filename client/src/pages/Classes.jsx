import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Clock, Users, Plus, X, Video, Trash2, CheckCircle, Code, ExternalLink, Info } from 'lucide-react';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCodeSyncInfo, setShowCodeSyncInfo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skill: '',
    date: '',
    duration: 60,
    meetingLink: 'https://c0desync.netlify.app',
    maxParticipants: 20
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const [allRes, mineRes, enrolledRes] = await Promise.all([
        api.get('/classes/all'),
        api.get('/classes/my-classes'),
        api.get('/classes/enrolled')
      ]);

      setClasses(allRes.data);
      setMyClasses(mineRes.data);
      setEnrolledClasses(enrolledRes.data);
      setError('');
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.skill) {
      setError('Please fill in all required fields (Title, Date, Skill).');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      await api.post('/classes/create', formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        skill: '',
        date: '',
        duration: 60,
        meetingLink: 'https://c0desync.netlify.app',
        maxParticipants: 20
      });
      fetchClasses();
      setError('');
    } catch (error) {
      console.error('Error creating class:', error);
      setError(error.response?.data?.message || 'Error creating class. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleJoinClass = async (classId) => {
    try {
      await api.post(`/classes/${classId}/join`);
      fetchClasses();
      setError('');
    } catch (error) {
      console.error('Error joining class:', error);
      setError(error.response?.data?.message || 'Error joining class. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleLeaveClass = async (classId) => {
    try {
      await api.post(`/classes/${classId}/leave`);
      fetchClasses();
      setError('');
    } catch (error) {
      console.error('Error leaving class:', error);
      setError(error.response?.data?.message || 'Error leaving class. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class? This cannot be undone.')) {
      try {
        await api.delete(`/classes/${classId}`);
        fetchClasses();
        setError('');
      } catch (error) {
        console.error('Error deleting class:', error);
        setError(error.response?.data?.message || 'Error deleting class. Please try again.');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const ClassCard = ({ cls, isMine = false, isEnrolled = false }) => {
    const classDate = new Date(cls.date);
    const isPast = classDate < new Date();
    const classId = cls._id || cls.id;

    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900">{cls.title}</h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {cls.skill}
              </span>
              {cls.status === 'completed' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center space-x-1">
                  <CheckCircle size={12} />
                  <span>Completed</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">{cls.description}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>{classDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>{classDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} • {cls.duration} minutes</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users size={16} />
            <span>{cls.participants?.length || 0} / {cls.maxParticipants} enrolled</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 flex-1">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {cls.host?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm text-gray-700">{cls.host?.name || 'Unknown'}</span>
          </div>

          {isMine ? (
            <div className="flex space-x-2">
              {cls.meetingLink && (
                <a
                  href={cls.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  title="Join Meeting"
                >
                  <Video size={16} />
                </a>
              )}
              <button
                onClick={() => handleDeleteClass(classId)}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : isEnrolled ? (
            <div className="flex space-x-2">
              {cls.meetingLink && !isPast && (
                <a
                  href={cls.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-2"
                >
                  <Video size={16} />
                  <span>Join</span>
                </a>
              )}
              <button
                onClick={() => handleLeaveClass(classId)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Leave
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleJoinClass(classId)}
              disabled={cls.participants?.length >= cls.maxParticipants || isPast}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPast ? 'Past' : cls.participants?.length >= cls.maxParticipants ? 'Full' : 'Join'}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* CodeSync Info Banner */}
      {showCodeSyncInfo && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 relative">
          <button
            onClick={() => setShowCodeSyncInfo(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 rounded-lg p-3 flex-shrink-0">
              <Code size={24} className="text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                <span>Powered by CodeSync</span>
                <Info size={16} className="text-blue-600" />
              </h3>
              
              <p className="text-gray-700 mb-4">
                All classes use <strong>CodeSync</strong> - a collaborative platform for code sharing and real-time learning. 
                CodeSync provides AI-powered code summaries, live collaboration tools, and seamless integration for an 
                enhanced learning experience.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://c0desync.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink size={16} />
                  <span>Open CodeSync</span>
                </a>
                
                <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-blue-200 text-sm">
                  <span className="text-gray-600">Default Platform:</span>
                  <code className="text-blue-600 font-mono">c0desync.netlify.app</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Classes</h1>
          <p className="text-gray-600">Join free classes or host your own learning sessions on CodeSync</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Class</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Classes ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'mine'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Classes ({myClasses.length})
        </button>
        <button
          onClick={() => setActiveTab('enrolled')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'enrolled'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Enrolled ({enrolledClasses.length})
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {activeTab === 'all' && classes.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <p className="text-gray-500">No classes available yet. Be the first to create one!</p>
          </div>
        )}
        {activeTab === 'all' && classes.map((cls) => <ClassCard key={cls._id} cls={cls} />)}
        
        {activeTab === 'mine' && myClasses.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <p className="text-gray-500">You haven't created any classes yet.</p>
          </div>
        )}
        {activeTab === 'mine' && myClasses.map((cls) => <ClassCard key={cls._id} cls={cls} isMine={true} />)}
        
        {activeTab === 'enrolled' && enrolledClasses.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <p className="text-gray-500">You haven't enrolled in any classes yet.</p>
          </div>
        )}
        {activeTab === 'enrolled' && enrolledClasses.map((cls) => <ClassCard key={cls._id} cls={cls} isEnrolled={true} />)}
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Class</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skill/Topic</label>
                  <input
                    type="text"
                    value={formData.skill}
                    onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="15"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Link 
                    <span className="text-blue-600 ml-2">(Default: CodeSync)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://c0desync.netlify.app"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Classes use CodeSync by default for collaborative learning
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 20 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateClass}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Class
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;