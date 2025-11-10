import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  MapPin, Mail, Award, Target, Star, MessageCircle,
  UserPlus, UserCheck, ChevronLeft, ThumbsUp, Calendar
} from 'lucide-react';

const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('none'); // 'none', 'pending', 'connected'

  useEffect(() => {
    fetchUserProfile();
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setUser(response.data);

      // Check connection status
      if (currentUser.connections?.includes(id)) {
        setConnectionStatus('connected');
      } else if (currentUser.sentRequests?.some(req => req.to === id)) {
        setConnectionStatus('pending');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      await api.post(`/connections/request/${id}`);
      setConnectionStatus('pending');
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleEndorse = async (skillName) => {
    try {
      await api.post(`/users/${id}/endorse`, { skill: skillName });
      fetchUserProfile();
    } catch (error) {
      console.error('Error endorsing skill:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <Link to="/search" className="btn-primary">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft size={20} />
        <span>Back</span>
      </button>

      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-4xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                {user.location && (
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <MapPin size={18} />
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail size={18} />
                  <span>{user.email}</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                {connectionStatus === 'connected' ? (
                  <>
                    <button
                      disabled
                      className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg cursor-not-allowed"
                    >
                      <UserCheck size={20} />
                      <span>Connected</span>
                    </button>
                    <Link
                      to="/messages"
                      className="btn-primary flex items-center justify-center space-x-2"
                    >
                      <MessageCircle size={20} />
                      <span>Message</span>
                    </Link>
                  </>
                ) : connectionStatus === 'pending' ? (
                  <button
                    disabled
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed"
                  >
                    <UserPlus size={20} />
                    <span>Request Sent</span>
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <UserPlus size={20} />
                    <span>Connect</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="mb-4">
                <p className="text-gray-700">{user.bio}</p>
              </div>
            )}

            {/* Rating */}
            {user.ratings && user.ratings.count > 0 && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Star className="text-yellow-400 fill-yellow-400" size={20} />
                  <span className="text-lg font-semibold text-gray-900">
                    {user.ratings.average.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-600">
                  ({user.ratings.count} {user.ratings.count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills to Teach */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <Award className="text-green-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Skills to Teach</h2>
            </div>

            {user.skillsToTeach && user.skillsToTeach.length > 0 ? (
              <div className="space-y-4">
                {user.skillsToTeach.map((skill, index) => (
                  <div
                    key={index}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{skill.name}</h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                          <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full">
                            {skill.level}
                          </span>
                          {skill.yearsOfExperience && (
                            <span>{skill.yearsOfExperience}+ years experience</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEndorse(skill.name)}
                        className="flex items-center space-x-1 px-3 py-1 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                      >
                        <ThumbsUp size={14} />
                        <span>Endorse</span>
                      </button>
                    </div>

                    {/* Endorsements */}
                    {user.endorsements && user.endorsements.filter(e => e.skill === skill.name).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-300">
                        <p className="text-xs text-gray-600 mb-2">
                          {user.endorsements.filter(e => e.skill === skill.name).length} endorsements
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No skills listed yet</p>
            )}
          </div>

          {/* Skills to Learn */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <Target className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Skills to Learn</h2>
            </div>

            {user.skillsToLearn && user.skillsToLearn.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {user.skillsToLearn.map((skill, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="font-medium text-gray-900">{skill.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{skill.priority} Priority</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No learning goals listed yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Connections</span>
                <span className="font-semibold text-gray-900">
                  {user.connections?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Skills to Teach</span>
                <span className="font-semibold text-green-600">
                  {user.skillsToTeach?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Skills to Learn</span>
                <span className="font-semibold text-blue-600">
                  {user.skillsToLearn?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Endorsements</span>
                <span className="font-semibold text-gray-900">
                  {user.endorsements?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="card">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar size={18} />
              <span className="text-sm">
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;