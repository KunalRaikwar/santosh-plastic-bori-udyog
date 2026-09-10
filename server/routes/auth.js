const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, JWT_SECRET } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ message: 'सभी फील्ड भरना आवश्यक है।' });
    }
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'यह username पहले से मौजूद है।' });
    }
    const user = new User({ username, password, name, role: role || 'owner' });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user._id, username: user.username, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'रजिस्ट्रेशन में समस्या हुई है।', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username और Password दोनों आवश्यक हैं।' });
    }
    const user = await User.findOne({ username: username.toLowerCase(), isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'गलत Username या Password।' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'गलत Username या Password।' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, username: user.username, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'लॉगिन में समस्या हुई है।', error: error.message });
  }
});

// Forgot / Reset password
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, securityPin, newPassword } = req.body;
    if (!username || !newPassword) {
      return res.status(400).json({ message: 'Username और नया Password दोनों आवश्यक हैं।' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'Password कम से कम 4 अक्षरों का होना चाहिए।' });
    }

    // Security PIN check: default 123456 or match
    const masterPin = process.env.RESET_SECURITY_PIN || '123456';
    if (securityPin && securityPin.trim() !== masterPin) {
      return res.status(400).json({ message: 'गलत सिक्योरिटी पिन (Wrong Security PIN)!' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim(), isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'इस Username से कोई एक्टिव यूज़र नहीं मिला।' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'पासवर्ड सफलतापूर्वक बदल दिया गया है! अब आप नए पासवर्ड से लॉगिन कर सकते हैं।' });
  } catch (error) {
    res.status(500).json({ message: 'पासवर्ड बदलने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
