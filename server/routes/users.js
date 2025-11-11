const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all users (search)
router.get('/search', auth, async (req, res) => {
  try {
    const { query, skill } = req.query;
    let filter = { _id: { $ne: req.userId }, isPublic: true };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { 'skillsToTeach.name': { $regex: query, $options: 'i' } }
      ];
    }

    if (skill) {
      filter['skillsToTeach.name'] = { $regex: skill, $options: 'i' };
    }

    const users = await User.find(filter)
      .select('name email profileImage location skillsToTeach skillsToLearn ratings')
      .limit(50);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('connections', 'name email profileImage')
      .populate('endorsements.endorsedBy', 'name profileImage');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile - SIMPLE VERSION (no file upload yet)
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('Profile update request received:', req.body);
    
    let { name, bio, location, skillsToTeach, skillsToLearn, isPublic } = req.body;

    // Parse JSON strings if they come as strings (from FormData)
    if (typeof skillsToTeach === 'string') {
      try {
        skillsToTeach = JSON.parse(skillsToTeach);
      } catch (e) {
        console.error('Error parsing skillsToTeach:', e);
        skillsToTeach = [];
      }
    }

    if (typeof skillsToLearn === 'string') {
      try {
        skillsToLearn = JSON.parse(skillsToLearn);
      } catch (e) {
        console.error('Error parsing skillsToLearn:', e);
        skillsToLearn = [];
      }
    }

    // Handle isPublic conversion
    if (typeof isPublic === 'string') {
      isPublic = isPublic === 'true';
    }

    // Prepare update object
    const updateData = {
      name,
      bio,
      location,
      skillsToTeach: skillsToTeach || [],
      skillsToLearn: skillsToLearn || [],
      isPublic: isPublic !== undefined ? isPublic : true
    };

    console.log('Updating user with data:', updateData);

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User updated successfully:', user._id);
    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// AI Matchmaking - Get recommended users
router.get('/recommendations/matches', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skillsToLearn = currentUser.skillsToLearn?.map(s => s.name.toLowerCase()) || [];

    if (skillsToLearn.length === 0) {
      return res.json([]);
    }

    // Find users who teach what current user wants to learn
    const matches = await User.find({
      _id: { $ne: req.userId, $nin: currentUser.connections || [] },
      isPublic: true,
      'skillsToTeach.name': {
        $in: skillsToLearn.map(s => new RegExp(s, 'i'))
      }
    })
    .select('name email profileImage location skillsToTeach skillsToLearn ratings')
    .limit(10);

    // Calculate match score
    const scoredMatches = matches.map(match => {
      let score = 0;
      
      // Skills match score
      match.skillsToTeach.forEach(skill => {
        if (skillsToLearn.includes(skill.name.toLowerCase())) {
          score += 10;
          // Bonus for experience level
          if (skill.level === 'Expert') score += 5;
          if (skill.level === 'Advanced') score += 3;
        }
      });

      // Mutual learning opportunity
      const matchSkillsToLearn = match.skillsToLearn?.map(s => s.name.toLowerCase()) || [];
      currentUser.skillsToTeach?.forEach(skill => {
        if (matchSkillsToLearn.includes(skill.name.toLowerCase())) {
          score += 15; // Higher score for mutual benefit
        }
      });

      // Rating bonus
      score += (match.ratings?.average || 0) * 2;

      return {
        ...match.toObject(),
        matchScore: score
      };
    });

    // Sort by score
    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

    res.json(scoredMatches.slice(0, 5));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endorse a skill
router.post('/:id/endorse', auth, async (req, res) => {
  try {
    const { skill } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          endorsements: {
            skill,
            endorsedBy: req.userId
          }
        }
      },
      { new: true }
    ).populate('endorsements.endorsedBy', 'name profileImage');

    res.json(user.endorsements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;