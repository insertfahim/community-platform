const User = require('../models/User');

// register user
const register = async (req, res) => {
    console.log('🔥 register() called with:', req.body);
    const { name, email, password } = req.body;

  // validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  try {
    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const userId = await User.createUser({ name, email, password });
    return res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    return res.status(200).json({ message: 'Login successful', userId: user.id });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login
};
