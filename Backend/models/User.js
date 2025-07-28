import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

export default  User;