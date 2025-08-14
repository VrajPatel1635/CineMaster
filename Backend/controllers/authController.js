// PATCH /api/user/name - update user's name
export const updateUserName = async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;
  if (!name || !userId) return res.status(400).json({ message: 'Name and userId required' });
  try {
    const user = await User.findByIdAndUpdate(userId, { name }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
// Backend/controllers/authController.js

import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  console.log('Received body:', req.body);
  const { email, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

  const newUser = await User.create({ email, password });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ user: newUser, token });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ user, token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: 'Server error' });
  }
};
