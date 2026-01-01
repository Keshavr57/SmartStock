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
        default: 100000 // ₹1,00,000 starting balance
    },
    portfolio: [{
        symbol: String,
        quantity: Number,
        avgPrice: Number,
        purchaseDate: Date
    }],
    watchlist: [{
        symbol: String,
        addedDate: {
            type: Date,
            default: Date.now
        }
    }],
    transactions: [{
        type: {
            type: String,
            enum: ['BUY', 'SELL'],
            required: true
        },
        symbol: String,
        quantity: Number,
        price: Number,
        date: {
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
    timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });

export default mongoose.model('User', userSchema);