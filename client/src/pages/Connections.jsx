import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Users, UserCheck, UserPlus, X, Check, MessageCircle, Award, UserMinus } from 'lucide-react';

const Connections = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connections');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [connectionsRes, requestsRes] = await Promise.all([
        api.get('/connections/list'),
        api.get('/connections/requests')
      ]);

      setConnections(connectionsRes.data);
      setPendingRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await api.post(`/connections/accept/${userId}`);
      fetchData();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await api.post(`/connections/reject/${userId}`);
      fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleRemoveConnection = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from your connections?`)) {
      return;
    }

    try {
      await api.delete(`/connections/remove/${userId}`);
      fetchData(); // Refresh the list
      alert('Connection removed successfully');
    } catch (error) {
      console.error('Error removing connection:', error);
      alert(error.response?.data?.message || 'Failed to remove connection');
    }
  };

  const handleMessageClick = (connection) => {
    navigate('/messages', { 
      state: { 
        selectedUser: {
          _id: connection._id,
          name: connection.name,
          email: connection.email
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Network</h1>
        <p className="text-gray-600">Manage your connections and pending requests</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('connections')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'connections'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Users size={20} />
            <span>Connections</span>
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {connections.length}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'requests'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <UserPlus size={20} />
            <span>Requests</span>
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'connections' ? (
        connections.length === 0 ? (
          <div className="text-center py-12 card">
            <Users className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No connections yet</h3>
            <p className="text-gray-600 mb-4">Start connecting with others to grow your network</p>
            <Link to="/search" className="btn-primary">
              Find Connections
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((connection) => (
              <div key={connection._id} className="card hover:shadow-lg transition-all">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">
                      {connection.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <Link
                    to={`/user/${connection._id}`}
                    className="text-lg font-bold text-gray-900 hover:text-primary-600 block mb-1"
                  >
                    {connection.name}
                  </Link>

                  {connection.location && (
                    <p className="text-sm text-gray-600 mb-4">{connection.location}</p>
                  )}

                  {/* Skills */}
                  {connection.skillsToTeach && connection.skillsToTeach.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-center space-x-1 text-xs text-gray-600 mb-2">
                        <Award size={12} />
                        <span>Can Teach</span>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {connection.skillsToTeach.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Link
                        to={`/user/${connection._id}`}
                        className="flex-1 btn-secondary text-sm"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => handleMessageClick(connection)}
                        className="flex-1 btn-primary text-sm flex items-center justify-center space-x-1"
                      >
                        <MessageCircle size={14} />
                        <span>Message</span>
                      </button>
                    </div>
                    
                    {/* Remove Connection Button */}
                    <button
                      onClick={() => handleRemoveConnection(connection._id, connection.name)}
                      className="w-full px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm flex items-center justify-center space-x-1 transition-colors"
                    >
                      <UserMinus size={14} />
                      <span>Remove Connection</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        pendingRequests.length === 0 ? (
          <div className="text-center py-12 card">
            <UserCheck className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending requests</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.from._id} className="card">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-semibold">
                      {request.from.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/user/${request.from._id}`}
                      className="text-lg font-bold text-gray-900 hover:text-primary-600 block mb-1"
                    >
                      {request.from.name}
                    </Link>
                    <p className="text-sm text-gray-600 mb-2">{request.from.email}</p>

                    {request.from.skillsToTeach && request.from.skillsToTeach.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {request.from.skillsToTeach.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(request.from._id)}
                      className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Accept"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.from._id)}
                      className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Reject"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Connections;