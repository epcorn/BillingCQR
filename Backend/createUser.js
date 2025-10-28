require('dotenv').config();
const mongoose = require('mongoose');
const BillingUser = require('../Backend/models/BillingUser'); // Import your model

async function createUser() {
  try {
    // Connect to MongoDB using URI from .env
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('❌ MONGO_URI not found in .env file');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Fixed user data
    const userData = {
      name: '',
      email: '',
      password: '',
      role: '',
    };

    // Check if user already exists
    const existingUser = await BillingUser.findOne({ email: userData.email });
    if (existingUser) {
      console.log('⚠️ User already exists with this email.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create and save new user
    const newUser = new BillingUser(userData);
    await newUser.save();

    console.log('🎉 User created successfully:');
    console.log({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    });

  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createUser();
