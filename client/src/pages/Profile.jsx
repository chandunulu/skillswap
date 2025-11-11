import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, MapPin, Mail, Award, Target, Plus, X, Save, Edit2, Check } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    isPublic: true
  });

  const [skillsToTeach, setSkillsToTeach] = useState([]);
  const [skillsToLearn, setSkillsToLearn] = useState([]);
  const [newTeachSkill, setNewTeachSkill] = useState({ name: '', level: 'Intermediate', yearsOfExperience: 1 });
  const [newLearnSkill, setNewLearnSkill] = useState({ name: '', priority: 'Medium' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        isPublic: user.isPublic !== undefined ? user.isPublic : true
      });
      setSkillsToTeach(user.skillsToTeach || []);
      setSkillsToLearn(user.skillsToLearn || []);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addTeachSkill = () => {
    if (newTeachSkill.name.trim()) {
      setSkillsToTeach([...skillsToTeach, { ...newTeachSkill }]);
      setNewTeachSkill({ name: '', level: 'Intermediate', yearsOfExperience: 1 });
    }
  };

  const removeTeachSkill = (index) => {
    setSkillsToTeach(skillsToTeach.filter((_, i) => i !== index));
  };

  const addLearnSkill = () => {
    if (newLearnSkill.name.trim()) {
      setSkillsToLearn([...skillsToLearn, { ...newLearnSkill }]);
      setNewLearnSkill({ name: '', priority: 'Medium' });
    }
  };

  const removeLearnSkill = (index) => {
    setSkillsToLearn(skillsToLearn.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/users/profile', {
        ...formData,
        skillsToTeach,
        skillsToLearn
      });

      updateUser(response.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Edit2 size={20} />
            <span>Edit Profile</span>
          </button>
        ) : (
          <button
            onClick={() => setEditing(false)}
            className="btn-secondary flex items-center space-x-2"
          >
            <X size={20} />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="space-y-4">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {formData.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!editing}
                className="input disabled:bg-gray-50"
                required
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={!editing}
                placeholder="City, Country"
                className="input disabled:bg-gray-50"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!editing}
                rows={4}
                placeholder="Tell us about yourself..."
                className="input disabled:bg-gray-50"
              />
            </div>

            {/* Privacy */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                disabled={!editing}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label className="text-sm text-gray-700">Make my profile public</label>
            </div>
          </div>
        </div>

        {/* Skills to Teach */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <Award className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Skills I Can Teach</h2>
          </div>

          <div className="space-y-4">
            {/* Existing Skills */}
            <div className="flex flex-wrap gap-3">
              {skillsToTeach.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2"
                >
                  <div>
                    <div className="font-medium text-gray-900">{skill.name}</div>
                    <div className="text-xs text-gray-600">
                      {skill.level} • {skill.yearsOfExperience}+ years
                    </div>
                  </div>
                  {editing && (
                    <button
                      type="button"
                      onClick={() => removeTeachSkill(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Skill */}
            {editing && (
              <div className="border-t pt-4 space-y-3">
                <input
                  type="text"
                  value={newTeachSkill.name}
                  onChange={(e) => setNewTeachSkill({ ...newTeachSkill, name: e.target.value })}
                  placeholder="Skill name (e.g., JavaScript)"
                  className="input"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newTeachSkill.level}
                    onChange={(e) => setNewTeachSkill({ ...newTeachSkill, level: e.target.value })}
                    className="input"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  <input
                    type="number"
                    value={newTeachSkill.yearsOfExperience}
                    onChange={(e) => setNewTeachSkill({ ...newTeachSkill, yearsOfExperience: parseInt(e.target.value) })}
                    min="0"
                    placeholder="Years"
                    className="input"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTeachSkill}
                  className="btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Add Skill to Teach</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Skills to Learn */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Skills I Want to Learn</h2>
          </div>

          <div className="space-y-4">
            {/* Existing Skills */}
            <div className="flex flex-wrap gap-3">
              {skillsToLearn.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2"
                >
                  <div>
                    <div className="font-medium text-gray-900">{skill.name}</div>
                    <div className="text-xs text-gray-600">{skill.priority} Priority</div>
                  </div>
                  {editing && (
                    <button
                      type="button"
                      onClick={() => removeLearnSkill(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Skill */}
            {editing && (
              <div className="border-t pt-4 space-y-3">
                <input
                  type="text"
                  value={newLearnSkill.name}
                  onChange={(e) => setNewLearnSkill({ ...newLearnSkill, name: e.target.value })}
                  placeholder="Skill name (e.g., Python)"
                  className="input"
                />
                <select
                  value={newLearnSkill.priority}
                  onChange={(e) => setNewLearnSkill({ ...newLearnSkill, priority: e.target.value })}
                  className="input"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
                <button
                  type="button"
                  onClick={addLearnSkill}
                  className="btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Add Skill to Learn</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        {editing && (
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <Save size={20} />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </form>

      {/* Profile Stats */}
      {!editing && (
        <div className="card mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Stats</h2>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600">{user?.connections?.length || 0}</div>
              <div className="text-sm text-gray-600">Connections</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{skillsToTeach.length}</div>
              <div className="text-sm text-gray-600">Skills to Teach</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{skillsToLearn.length}</div>
              <div className="text-sm text-gray-600">Skills to Learn</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;