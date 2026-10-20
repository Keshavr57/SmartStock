import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

let mongod;

export async function startDb() {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: 'SmartStockTest' });
    await User.init();
}

export async function stopDb() {
    await mongoose.disconnect();
    await mongod?.stop();
}

export async function clearDb() {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map(c => c.deleteMany({})));
}

export async function createUser(overrides = {}) {
    return User.create({
        name: 'Test User',
        email: `user${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`,
        password: 'hashed',
        ...overrides
    });
}

export function tokenFor(user) {
    return jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Deterministic price provider for service tests.
export function fixedPrice(price, extra = {}) {
    return async (symbol) => ({
        symbol, name: symbol, price, previousClose: price, asOf: new Date().toISOString(), source: 'test', ...extra
    });
}
