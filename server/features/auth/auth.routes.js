import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import User from '../../models/User.js';
import { ensureConnection } from '../../config/db.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to get JWT_SECRET with validation
const getJWTSecret = () => {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        console.error('❌ CRITICAL: JWT_SECRET environment variable is not set!');
        console.error('Please set JWT_SECRET in your .env file');
        process.exit(1);
    }
    return JWT_SECRET;
};

// Optimized database connection check
const ensureDatabaseConnection = async () => {
    const isConnected = await ensureConnection();
    if (!isConnected) {
        throw new Error('Database connection required for authentication');
    }
    return true;
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, getJWTSecret(), (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Register with email/password
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        // Ensure database connection
        await ensureDatabaseConnection();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        const saltRounds = 12; // Increased security
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        await user.save();
        console.log(`✅ New user registered: ${email}`);

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            getJWTSecret(),
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                virtualBalance: user.virtualBalance,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// Login with email/password
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Ensure database connection
        await ensureDatabaseConnection();

        // Find user by email (case insensitive)
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log(`✅ User logged in: ${email}`);

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            getJWTSecret(),
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                virtualBalance: user.virtualBalance,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// Google OAuth login
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        
        console.log('Google OAuth attempt:', {
            hasToken: !!token,
            clientId: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'missing',
            origin: req.headers.origin
        });
        
        if (!token) {
            return res.status(400).json({ 
                success: false,
                error: 'Google token is required' 
            });
        }

        // Check if Google client is properly configured
        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('Google Client ID not configured');
            return res.status(500).json({ 
                success: false,
                error: 'Google OAuth not configured' 
            });
        }

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        console.log('Google OAuth payload:', { googleId, email, name });

        // Ensure database connection
        await ensureDatabaseConnection();

        // Check if user exists
        let user = await User.findOne({ 
            $or: [{ googleId }, { email }] 
        });

        if (user) {
            // Update Google ID if not set
            if (!user.googleId) {
                user.googleId = googleId;
                user.avatar = picture;
                await user.save();
            }
            console.log('Existing user found:', user.email);
        } else {
            // Create new user
            user = new User({
                name,
                email,
                googleId,
                avatar: picture,
                virtualBalance: 100000 // ₹1 lakh starting balance
            });
            await user.save();
            console.log('New user created:', user.email);
        }

        const jwtToken = jwt.sign(
            { userId: user._id, email: user.email },
            getJWTSecret(),
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Google login successful',
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                virtualBalance: user.virtualBalance
            }
        });

    } catch (error) {
        console.error('Google OAuth error:', error);
        
        // More specific error handling
        if (error.message.includes('Token used too early')) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid token timing' 
            });
        }
        
        if (error.message.includes('Invalid token')) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid Google token' 
            });
        }

        res.status(500).json({
            success: false,
            error: 'Google authentication failed',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Authentication error'
        });
    }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        // Ensure database connection
        await ensureDatabaseConnection();

        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate new token with extended expiry
        const newToken = jwt.sign(
            { userId: user._id, email: user.email },
            getJWTSecret(),
            { expiresIn: '7d' }
        );

        console.log(`✅ Token refreshed for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            token: newToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                virtualBalance: user.virtualBalance,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        // Ensure database connection
        await ensureDatabaseConnection();

        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                virtualBalance: user.virtualBalance,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Token verification failed' });
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        // Ensure database connection
        await ensureDatabaseConnection();

        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                virtualBalance: user.virtualBalance,
                avatar: user.avatar,
                portfolio: user.portfolio,
                watchlist: user.watchlist,
                transactions: user.transactions.slice(-10) // Last 10 transactions
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, avatar } = req.body;

        // Ensure database connection
        await ensureDatabaseConnection();

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (name) user.name = name.trim();
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                virtualBalance: user.virtualBalance,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

export { router, authenticateToken };
export default router;
