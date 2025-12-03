const mongoose = require('mongoose');
const emoji = require('./emoji');

let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;

const userSchema = new mongoose.Schema({
    uniqueId: { type: String, required: true, unique: true, index: true },
    guildId: { type: String, required: true, index: true },
    odId: { type: String, required: true, index: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    coins: { type: Number, default: 100 },
    totalMessages: { type: Number, default: 0 },
    lastXpTime: { type: Number, default: 0 },
    lastDaily: { type: Number, default: 0 },
    inventory: { type: Array, default: [] },
    warnings: { type: Array, default: [] },
    nickname: { type: String, default: null },
    bio: { type: String, default: null },
    favoriteGame: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const mailSchema = new mongoose.Schema({
    mailId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true, index: true },
    toUserId: { type: String, required: true, index: true },
    fromUserId: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

const modLogSchema = new mongoose.Schema({
    logId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    moderatorId: { type: String, required: true },
    targetId: { type: String, required: true, index: true },
    reason: { type: String, default: 'No reason provided' },
    timestamp: { type: Date, default: Date.now }
});

const guildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    prefix: { type: String, default: '!' },
    welcomeChannel: { type: String, default: null },
    welcomeMessage: { type: String, default: null },
    leaveChannel: { type: String, default: null },
    leaveMessage: { type: String, default: null },
    logsChannel: { type: String, default: null },
    automodEnabled: { type: Boolean, default: true },
    levelingEnabled: { type: Boolean, default: true },
    economyEnabled: { type: Boolean, default: true },
    joinRoles: { type: Array, default: [] },
    mutedRole: { type: String, default: null },
    autoReactEnabled: { type: Boolean, default: true },
    autoReactKeywords: { type: Map, of: String, default: new Map() },
    mentionReactionsEnabled: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true, index: true },
    fromUserId: { type: String, required: true },
    toUserId: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, required: true },
    reason: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
});

const gameStatSchema = new mongoose.Schema({
    uniqueId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true, index: true },
    odId: { type: String, required: true, index: true },
    game: { type: String, required: true, index: true },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    lastPlayed: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

const automodViolationSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    odId: { type: String, required: true, index: true },
    violationType: { type: String, required: true },
    messageContent: { type: String, default: '' },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Mail = mongoose.model('Mail', mailSchema);
const ModLog = mongoose.model('ModLog', modLogSchema);
const GuildSettings = mongoose.model('GuildSettings', guildSettingsSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const GameStat = mongoose.model('GameStat', gameStatSchema);
const AutomodViolation = mongoose.model('AutomodViolation', automodViolationSchema);

async function connectDB() {
    if (isConnected) return true;
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.log(`${emoji.warning} MongoDB URI not configured - using fallback JSON storage`);
        return false;
    }
    
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        isConnected = true;
        connectionRetries = 0;
        console.log(`${emoji.success} MongoDB connected successfully`);
        
        mongoose.connection.on('error', (err) => {
            console.error(`${emoji.error} MongoDB connection error:`, err.message);
            isConnected = false;
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log(`${emoji.warning} MongoDB disconnected`);
            isConnected = false;
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log(`${emoji.success} MongoDB reconnected`);
            isConnected = true;
        });
        
        return true;
    } catch (error) {
        connectionRetries++;
        console.error(`${emoji.error} MongoDB connection failed (attempt ${connectionRetries}/${MAX_RETRIES}):`, error.message);
        
        if (connectionRetries < MAX_RETRIES) {
            console.log(`${emoji.pending} Retrying in 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return connectDB();
        }
        
        return false;
    }
}

function isDBConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
    connectDB,
    isDBConnected,
    User,
    Mail,
    ModLog,
    GuildSettings,
    Transaction,
    GameStat,
    AutomodViolation,
    mongoose
};
