const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'santosh-plastic-bori-udyog-secret-key-2026';

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'कृपया पहले लॉगिन करें।' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'सत्र समाप्त हो गया है। कृपया दोबारा लॉगिन करें।' });
  }
};

module.exports = { auth, JWT_SECRET };
