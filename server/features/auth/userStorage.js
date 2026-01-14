// Shared in-memory user storage
const inMemoryUsers = new Map();
let userIdCounter = 1000;

export { inMemoryUsers, userIdCounter };

// Helper function to increment user ID counter
export const getNextUserId = () => {
    return `temp_${userIdCounter++}`;
};