const { db } = require('../../config/firebase');

const TEAMS_COLLECTION = 'teams';
const QUESTIONS_COLLECTION = 'questions';

function getTeamsCollection() {
  if (!db) throw new Error('Firestore not initialized');
  return db.collection(TEAMS_COLLECTION);
}

function getQuestionsCollection() {
  if (!db) throw new Error('Firestore not initialized');
  return db.collection(QUESTIONS_COLLECTION);
}

async function findTeamByName(teamName) {
  if (!teamName) return null;
  // Try exact match first
  let snapshot = await getTeamsCollection().where('teamName', '==', teamName).limit(1).get();
  if (snapshot.empty) {
    // Try lowercase match to handle case differences
    snapshot = await getTeamsCollection().where('teamName', '==', String(teamName).toLowerCase()).limit(1).get();
  }
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

function toPlainIfNeeded(obj) {
  if (!obj) return obj;
  const isPlain = obj.constructor === Object || Object.getPrototypeOf(obj) === Object.prototype;
  if (isPlain) return obj;
  if (typeof obj.toPlain === 'function') return obj.toPlain();
  return { ...obj };
}

async function createTeam(teamData) {
  const data = toPlainIfNeeded(teamData);
  const ref = await getTeamsCollection().add(data);
  const doc = await ref.get();
  return { id: doc.id, ...doc.data() };
}

async function findTeamById(teamId) {
  const doc = await getTeamsCollection().doc(teamId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function getQuestion(questionNumber) {
  const snapshot = await getQuestionsCollection().where('questionNumber', '==', Number(questionNumber)).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function createOrUpdateQuestion(questionData) {
  const data = toPlainIfNeeded(questionData);
  if (!data || typeof data.questionNumber === 'undefined') throw new Error('questionNumber required');
  const snapshot = await getQuestionsCollection().where('questionNumber', '==', Number(data.questionNumber)).limit(1).get();
  if (snapshot.empty) {
    const ref = await getQuestionsCollection().add(data);
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
  }
  const docRef = snapshot.docs[0].ref;
  await docRef.update(data);
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

async function deleteQuestionByNumber(questionNumber) {
  const snapshot = await getQuestionsCollection().where('questionNumber', '==', Number(questionNumber)).limit(1).get();
  if (snapshot.empty) return false;
  await snapshot.docs[0].ref.delete();
  return true;
}

async function listQuestions() {
  const snapshot = await getQuestionsCollection().orderBy('questionNumber', 'asc').get();
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function updateTeamProgress(teamId, updates) {
  const data = toPlainIfNeeded(updates);
  await getTeamsCollection().doc(teamId).update(data);
  const doc = await getTeamsCollection().doc(teamId).get();
  return { id: doc.id, ...doc.data() };
}

async function getAllTeamsSorted() {
  const snapshot = await getTeamsCollection().get();
  const teams = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  teams.sort((a, b) => {
    const aFinished = Boolean(a.finishTime);
    const bFinished = Boolean(b.finishTime);
    
    // Finished teams come first
    if (aFinished && !bFinished) return -1;
    if (!aFinished && bFinished) return 1;
    
    // Both finished - sort by finish time (earlier finish = higher rank)
    if (aFinished && bFinished) {
      const aTime = a.finishTime.toMillis ? a.finishTime.toMillis() : new Date(a.finishTime).getTime();
      const bTime = b.finishTime.toMillis ? b.finishTime.toMillis() : new Date(b.finishTime).getTime();
      return aTime - bTime;
    }
    
    // Both unfinished - sort by current question (higher = better), then by last correct answer time
    if ((b.currentQuestion || 0) !== (a.currentQuestion || 0)) {
      return (b.currentQuestion || 0) - (a.currentQuestion || 0);
    }
    
    // Same question - sort by who answered most recently
    const at = a.lastCorrectAnswerTimestamp ? a.lastCorrectAnswerTimestamp.toMillis ? a.lastCorrectAnswerTimestamp.toMillis() : new Date(a.lastCorrectAnswerTimestamp).getTime() : Infinity;
    const bt = b.lastCorrectAnswerTimestamp ? b.lastCorrectAnswerTimestamp.toMillis ? b.lastCorrectAnswerTimestamp.toMillis() : new Date(b.lastCorrectAnswerTimestamp).getTime() : Infinity;
    return at - bt;
  });
  
  return teams;
}

module.exports = {
  findTeamByName,
  createTeam,
  findTeamById,
  getQuestion,
  createOrUpdateQuestion,
  deleteQuestionByNumber,
  listQuestions,
  updateTeamProgress,
  getAllTeamsSorted,
};


