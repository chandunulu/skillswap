
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Search as SearchIcon, MapPin, Award, Star, Filter, UserPlus, Users, Sparkles } from 'lucide-react';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'recommended'

  useEffect(() => {
    fetchRecommendations();
    searchUsers();
  }, []); // Fixed: Added empty dependency array to run only once on mount

  const fetchRecommendations = async () => {
    try {
      const response = await api.get('/users/recommendations/matches');
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const searchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (skillFilter) params.append('skill', skillFilter);

      const response = await api.get(`/users/search?${params.toString()}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchUsers();
  };

  const sendConnectionRequest = async (userId) => {
    try {
      await api.post(`/connections/request/${userId}`);
      // Update UI to show request sent
      setUsers(users.map(user => 
        user._id === userId ? { ...user, requestSent: true } : user
      ));
      // Also update recommendations if the user is there
      setRecommendations(recommendations.map(user => 
        user._id === userId ? { ...user, requestSent: true } : user
      ));
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const UserCard = ({ user, showMatchScore = false }) => (
    <div className="card hover:shadow-lg transition-all duration-200">
      <div className="flex items-start space-x-4">
        {/* Profile Picture */}
        <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <Link 
                to={`/user/${user._id}`}
                className="text-lg font-bold text-gray-900 hover:text-primary-600"
              >
                {user.name}
              </Link>
              {user.location && (
                <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                  <MapPin size={14} />
                  <span>{user.location}</span>
                </div>
              )}
            </div>
            
            {showMatchScore && user.matchScore && (
              <div className="text-right">
                <div className="text-lg font-bold text-primary-600">{user.matchScore}%</div>
                <div className="text-xs text-gray-600">Match</div>
              </div>
            )}
          </div>

          {/* Skills to Teach */}
          {user.skillsToTeach && user.skillsToTeach.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <Award size={14} className="text-green-600" />
                <span className="text-xs font-medium text-gray-700">Can Teach</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.skillsToTeach.slice(0, 4).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200"
                  >
                    {skill.name}
                  </span>
                ))}
                {user.skillsToTeach.length > 4 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{user.skillsToTeach.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Skills to Learn */}
          {user.skillsToLearn && user.skillsToLearn.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Star size={14} className="text-blue-600" />
                <span className="text-xs font-medium text-gray-700">Wants to Learn</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.skillsToLearn.slice(0, 4).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                  >
                    {skill.name}
                  </span>
                ))}
                {user.skillsToLearn.length > 4 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{user.skillsToLearn.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Rating */}
          {user.ratings && user.ratings.average > 0 && (
            <div className="flex items-center space-x-1 mb-4">
              <Star className="text-yellow-400 fill-yellow-400" size={16} />
              <span className="text-sm font-semibold text-gray-900">
                {user.ratings.average.toFixed(1)}
              </span>
              <span className="text-sm text-gray-600">
                ({user.ratings.count} reviews)
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Link
              to={`/user/${user._id}`}
              className="btn-secondary text-sm"
            >
              View Profile
            </Link>
            {!user.requestSent ? (
              <button
                onClick={() => sendConnectionRequest(user._id)}
                className="btn-primary text-sm flex items-center space-x-2"
              >
                <UserPlus size={16} />
                <span>Connect</span>
              </button>
            ) : (
              <button
                disabled
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm cursor-not-allowed"
              >
                Request Sent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover & Connect</h1>
        <p className="text-gray-600">Find skilled professionals to learn from and collaborate with</p>
      </div>

      {/* Search Bar */}
      <div className="card mb-8">
        <div className="space-y-4">
          <div className="flex gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search by name, location, or skills..."
                className="input pl-11"
              />
            </div>

            {/* Skill Filter */}
            <div className="w-64 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Filter by skill..."
                className="input pl-11"
              />
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="btn-primary"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Users size={20} />
            <span>All Users</span>
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {users.length}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('recommended')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'recommended'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Sparkles size={20} />
            <span>Recommended</span>
            <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full">
              {recommendations.length}
            </span>
          </div>
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div>
          {activeTab === 'all' ? (
            users.length === 0 ? (
              <div className="text-center py-12 card">
                <SearchIcon className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {users.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
              </div>
            )
          ) : (
            recommendations.length === 0 ? (
              <div className="text-center py-12 card">
                <Sparkles className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No recommendations yet</h3>
                <p className="text-gray-600 mb-4">Add skills to your profile to get personalized matches</p>
                <Link to="/profile" className="btn-primary">
                  Update Profile
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="text-primary-600" size={20} />
                    <p className="text-sm text-primary-900">
                      These users are highly compatible with your learning goals and teaching skills!
                    </p>
                  </div>
                </div>
                <div className="grid gap-6">
                  {recommendations.map((user) => (
                    <UserCard key={user._id} user={user} showMatchScore={true} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Search;