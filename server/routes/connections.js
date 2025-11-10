const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Send connection request
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (req.userId === targetUserId) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    // Add to target user's pending requests
    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: {
        pendingRequests: { from: req.userId }
      }
    });

    // Add to current user's sent requests
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: {
        sentRequests: { to: targetUserId }
      }
    });

    res.json({ message: 'Connection request sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept connection request
router.post('/accept/:userId', auth, async (req, res) => {
  try {
    const requesterId = req.params.userId;

    // Add to both users' connections
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { connections: requesterId },
      $pull: { pendingRequests: { from: requesterId } }
    });

    await User.findByIdAndUpdate(requesterId, {
      $addToSet: { connections: req.userId },
      $pull: { sentRequests: { to: req.userId } }
    });

    res.json({ message: 'Connection request accepted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject connection request
router.post('/reject/:userId', auth, async (req, res) => {
  try {
    const requesterId = req.params.userId;

    await User.findByIdAndUpdate(req.userId, {
      $pull: { pendingRequests: { from: requesterId } }
    });

    await User.findByIdAndUpdate(requesterId, {
      $pull: { sentRequests: { to: req.userId } }
    });

    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending requests
router.get('/requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('pendingRequests.from', 'name email profilePicture skillsToTeach');

    res.json(user.pendingRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all connections
router.get('/list', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('connections', 'name email profilePicture location skillsToTeach ratings');

    res.json(user.connections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;