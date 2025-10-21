// Simple in-memory cache for questions
const NodeCache = require('node-cache');
const questionCache = new NodeCache({ stdTTL: 60 }); // 60 seconds TTL

module.exports = questionCache;
