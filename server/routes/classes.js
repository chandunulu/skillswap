const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a class
router.post('/create', auth, async (req, res) => {
  try {
    const { title, description, skill, date, duration, meetingLink, maxParticipants } = req.body;

    const newClass = new Class({
      title,
      description,
      host: req.userId,
      skill,
      date,
      duration,
      meetingLink,
      maxParticipants
    });

    await newClass.save();

    const populatedClass = await Class.findById(newClass._id)
      .populate('host', 'name email profilePicture');

    res.status(201).json(populatedClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all classes
router.get('/all', auth, async (req, res) => {
  try {
    const { skill, status } = req.query;
    let filter = {};

    if (skill) {
      filter.skill = { $regex: skill, $options: 'i' };
    }

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['scheduled', 'ongoing'] };
    }

    const classes = await Class.find(filter)
      .populate('host', 'name email profilePicture skillsToTeach ratings')
      .populate('participants', 'name profilePicture')
      .sort({ date: 1 });

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my hosted classes
router.get('/my-classes', auth, async (req, res) => {
  try {
    const classes = await Class.find({ host: req.userId })
      .populate('participants', 'name email profilePicture')
      .sort({ date: -1 });

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get classes I'm participating in
router.get('/enrolled', auth, async (req, res) => {
  try {
    const classes = await Class.find({ participants: req.userId })
      .populate('host', 'name email profilePicture skillsToTeach')
      .sort({ date: 1 });

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a class
router.post('/:classId/join', auth, async (req, res) => {
  try {
    const classToJoin = await Class.findById(req.params.classId);

    if (!classToJoin) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classToJoin.participants.length >= classToJoin.maxParticipants) {
      return res.status(400).json({ message: 'Class is full' });
    }

    if (classToJoin.participants.includes(req.userId)) {
      return res.status(400).json({ message: 'Already enrolled in this class' });
    }

    if (classToJoin.host.toString() === req.userId) {
      return res.status(400).json({ message: 'Cannot join your own class' });
    }

    classToJoin.participants.push(req.userId);
    await classToJoin.save();

    const updatedClass = await Class.findById(req.params.classId)
      .populate('host', 'name email profilePicture')
      .populate('participants', 'name profilePicture');

    res.json(updatedClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a class
router.post('/:classId/leave', auth, async (req, res) => {
  try {
    const classToLeave = await Class.findById(req.params.classId);

    if (!classToLeave) {
      return res.status(404).json({ message: 'Class not found' });
    }

    classToLeave.participants = classToLeave.participants.filter(
      p => p.toString() !== req.userId
    );

    await classToLeave.save();

    res.json({ message: 'Left class successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update class status
router.put('/:classId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const classToUpdate = await Class.findById(req.params.classId);

    if (!classToUpdate) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classToUpdate.host.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only host can update class status' });
    }

    classToUpdate.status = status;
    await classToUpdate.save();

    res.json(classToUpdate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a class
router.delete('/:classId', auth, async (req, res) => {
  try {
    const classToDelete = await Class.findById(req.params.classId);

    if (!classToDelete) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classToDelete.host.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only host can delete the class' });
    }

    await Class.findByIdAndDelete(req.params.classId);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;