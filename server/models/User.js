import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password required only if not Google user
        }
    },
    googleId: {
        type: String
    },
    avatar: {
        type: String,
        default: null
    },
    virtualBalance: {
        type: Number,
        default: 100000, // ₹1,00,000 starting balance
        min: 0
    },
    // Open positions. Cash + holdings live on the user document so an order is a single versioned write.
    portfolio: [{
        symbol: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        avgPrice: { type: Number, required: true, min: 0 },
        purchaseDate: Date
    }],
    watchlist: [{
        symbol: String,
        addedDate: {
            type: Date,
            default: Date.now
        }
    }],
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        notifications: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true,
    // Concurrent orders on the same user fail with VersionError instead of overwriting each other.
    optimisticConcurrency: true
});

// Index for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });

export default mongoose.model('User', userSchema);