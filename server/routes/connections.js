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

    // Check if already connected
    const currentUser = await User.findById(req.userId);
    const isAlreadyConnected = currentUser.connections.includes(targetUserId);
    
    if (isAlreadyConnected) {
      return res.status(400).json({ message: 'Already connected with this user' });
    }

    // Check if request already sent
    const requestAlreadySent = currentUser.sentRequests.some(
      req => req.to.toString() === targetUserId
    );
    
    if (requestAlreadySent) {
      return res.status(400).json({ message: 'Request already sent' });
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

// Remove/Unfollow connection - NEW ROUTE
router.delete('/remove/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    // Prevent removing yourself
    if (req.userId === targetUserId) {
      return res.status(400).json({ message: 'Cannot remove yourself' });
    }

    // Check if connection exists
    const currentUser = await User.findById(req.userId);
    const isConnected = currentUser.connections.some(
      conn => conn.toString() === targetUserId
    );

    if (!isConnected) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Remove from both users' connections arrays
    await User.findByIdAndUpdate(req.userId, {
      $pull: { connections: targetUserId }
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { connections: req.userId }
    });

    res.json({ 
      message: 'Connection removed successfully',
      removedUserId: targetUserId 
    });
  } catch (error) {
    console.error('Error removing connection:', error);
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