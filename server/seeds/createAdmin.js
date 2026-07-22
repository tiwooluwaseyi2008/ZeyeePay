const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Simple User Schema (same as your model)
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: String,
    walletBalance: { type: Number, default: 0 },
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payswift_vtu');
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@payswift.com' });
        
        if (existingAdmin) {
            console.log('Admin already exists!');
            console.log('Email: admin@payswift.com');
            console.log('Password: admin123');
            process.exit(0);
        }

        // Create admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const admin = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@payswift.com',
            phone: '08105002842',
            password: hashedPassword,
            walletBalance: 0,
            role: 'admin',
            isEmailVerified: true
        });

        console.log('Admin user created successfully!');
        console.log('Email: admin@payswift.com');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
};

createAdmin();