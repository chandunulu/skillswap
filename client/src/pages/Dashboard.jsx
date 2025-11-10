import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Users, MessageCircle, Calendar, TrendingUp, 
  Star, Award, Clock, ChevronRight, Sparkles,
  BookOpen, Target, Zap
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [recsRes, classesRes, connectionsRes, requestsRes] = await Promise.all([
        api.get('/users/recommendations/matches'),
        api.get('/classes/enrolled'),
        api.get('/connections/list'),
        api.get('/connections/requests')
      ]);

      setRecommendations(recsRes.data);
      setUpcomingClasses(classesRes.data.filter(c => new Date(c.date) > new Date()).slice(0, 3));
      setConnections(connectionsRes.data);
      setPendingRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Connections',
      value: connections.length,
      icon: Users,
      color: 'bg-blue-500',
      link: '/connections'
    },
    {
      label: 'Skills to Teach',
      value: user?.skillsToTeach?.length || 0,
      icon: Award,
      color: 'bg-green-500',
      link: '/profile'
    },
    {
      label: 'Skills to Learn',
      value: user?.skillsToLearn?.length || 0,
      icon: Target,
      color: 'bg-purple-500',
      link: '/profile'
    },
    {
      label: 'Upcoming Classes',
      value: upcomingClasses.length,
      icon: Calendar,
      color: 'bg-orange-500',
      link: '/classes'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600">Here's what's happening in your learning journey</p>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="text-primary-600" size={24} />
              <div>
                <h3 className="font-semibold text-gray-900">
                  You have {pendingRequests.length} pending connection request{pendingRequests.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-gray-600">Review and accept to start connecting</p>
              </div>
            </div>
            <Link to="/connections" className="btn-primary">
              View Requests
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="card hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Recommendations */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="text-primary-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
              </div>
              <Link to="/search" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Link>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-12">
                <Target className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 mb-4">No recommendations yet</p>
                <Link to="/profile" className="btn-primary">
                  Add Skills to Get Matches
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.slice(0, 3).map((rec) => (
                  <Link
                    key={rec._id}
                    to={`/user/${rec._id}`}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">
                        {rec.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{rec.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Award size={14} />
                        <span className="truncate">
                          {rec.skillsToTeach?.slice(0, 2).map(s => s.name).join(', ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-primary-600">
                          {rec.matchScore}% Match
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="text-yellow-400 fill-yellow-400" size={14} />
                          <span className="text-xs text-gray-600">
                            {rec.ratings?.average?.toFixed(1) || 'New'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-400" size={20} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Classes */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="text-primary-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Upcoming Classes</h2>
              </div>
              <Link to="/classes" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Link>
            </div>

            {upcomingClasses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 mb-4">No upcoming classes</p>
                <Link to="/classes" className="btn-primary">
                  Browse Classes
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingClasses.map((cls) => (
                  <div
                    key={cls._id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{cls.title}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {cls.skill}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{cls.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4 text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{new Date(cls.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users size={14} />
                          <span>{cls.participants.length} enrolled</span>
                        </div>
                      </div>
                      <Link to="/classes" className="text-primary-600 hover:text-primary-700 font-medium">
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/search"
                className="flex items-center space-x-3 p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <Users className="text-primary-600" size={20} />
                <span className="text-sm font-medium text-gray-900">Find Connections</span>
              </Link>
              <Link
                to="/classes"
                className="flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Calendar className="text-green-600" size={20} />
                <span className="text-sm font-medium text-gray-900">Browse Classes</span>
              </Link>
              <Link
                to="/messages"
                className="flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <MessageCircle className="text-purple-600" size={20} />
                <span className="text-sm font-medium text-gray-900">My Messages</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center space-x-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <Zap className="text-orange-600" size={20} />
                <span className="text-sm font-medium text-gray-900">Update Profile</span>
              </Link>
            </div>
          </div>

          {/* Learning Progress */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Skills</h3>
            
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Skills to Teach</span>
                <span className="font-semibold text-gray-900">
                  {user?.skillsToTeach?.length || 0}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {user?.skillsToTeach?.slice(0, 3).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {skill.name}
                  </span>
                ))}
                {user?.skillsToTeach?.length > 3 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    +{user.skillsToTeach.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Skills to Learn</span>
                <span className="font-semibold text-gray-900">
                  {user?.skillsToLearn?.length || 0}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {user?.skillsToLearn?.slice(0, 3).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {skill.name}
                  </span>
                ))}
                {user?.skillsToLearn?.length > 3 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    +{user.skillsToLearn.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <Link to="/profile" className="mt-4 block text-center text-primary-600 hover:text-primary-700 text-sm font-medium">
              Manage Skills →
            </Link>
          </div>

          {/* Profile Completion */}
          <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <h3 className="text-lg font-bold mb-2">Complete Your Profile</h3>
            <p className="text-sm text-primary-100 mb-4">
              Add more skills to get better matches!
            </p>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {Math.min(100, ((user?.skillsToTeach?.length || 0) + (user?.skillsToLearn?.length || 0)) * 20)}%
                </div>
                <div className="text-xs text-primary-100">Profile Complete</div>
              </div>
              <Link to="/profile" className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors">
                Update
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;