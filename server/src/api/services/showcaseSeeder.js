const bcrypt = require('bcryptjs');
const { db } = require('../../config/firebase');
const { createOrUpdateQuestion, findTeamByName, createTeam } = require('./firestore.service');
const { TeamModel } = require('../models/Team.model');

const defaultQuestions = [
  {
    "questionNumber": 1,
    "text": "What is the capital of France?",
    "answer": "Paris",
    "hint": "It's known as the city of lights."
  },
  {
    "questionNumber": 2,
    "text": "What is the chemical symbol for water?",
    "answer": "H2O",
    "hint": "Two hydrogens, one oxygen."
  },
  {
    "questionNumber": 3,
    "text": "Who wrote 'Romeo and Juliet'?",
    "answer": "Shakespeare",
    "hint": "Famous English playwright."
  },
  {
    "questionNumber": 4,
    "text": "What planet is known as the Red Planet?",
    "answer": "Mars",
    "hint": "Fourth planet from the sun."
  },
  {
    "questionNumber": 5,
    "text": "What is the largest mammal?",
    "answer": "Blue whale",
    "hint": "Lives in the ocean."
  },
  {
    "questionNumber": 6,
    "text": "What is the square root of 64?",
    "answer": "8",
    "hint": "It's a single digit."
  },
  {
    "questionNumber": 7,
    "text": "Who painted the Mona Lisa?",
    "answer": "Leonardo da Vinci",
    "hint": "Renaissance genius."
  },
  {
    "questionNumber": 8,
    "text": "What is the boiling point of water in Celsius?",
    "answer": "100",
    "hint": "A round number."
  },
  {
    "questionNumber": 9,
    "text": "What is the hardest natural substance?",
    "answer": "Diamond",
    "hint": "Used in jewelry and cutting tools."
  },
  {
    "questionNumber": 10,
    "text": "What is the largest continent?",
    "answer": "Asia",
    "hint": "Home to China and India."
  }
];

async function seedShowcaseData() {
  if (!db) {
    console.warn('[Seeder] Firestore not initialized, skipping database seeding.');
    return;
  }

  try {
    // 1. Seed Questions if empty
    const questionsSnap = await db.collection('questions').limit(1).get();
    if (questionsSnap.empty) {
      console.log('[Seeder] Questions collection is empty. Seeding default questions...');
      for (const q of defaultQuestions) {
        await createOrUpdateQuestion(q);
      }
      console.log('[Seeder] Seeding default questions complete.');
    } else {
      console.log('[Seeder] Questions collection already populated.');
    }

    // 2. Seed Demo Team
    const demoTeamName = 'demo-team';
    const existingDemoTeam = await findTeamByName(demoTeamName);
    if (!existingDemoTeam) {
      console.log(`[Seeder] Team "${demoTeamName}" not found. Creating default demo team...`);
      const hashed = await bcrypt.hash('password123', 10);
      const team = new TeamModel({
        teamName: demoTeamName,
        password: hashed,
        role: 'participant',
        currentQuestion: 1,
        lastCorrectAnswerTimestamp: null,
        finishTime: null,
        members: [
          { name: 'Demo Participant 1', contact: '0000000000' },
          { name: 'Demo Participant 2', contact: '1111111111' }
        ]
      });
      await createTeam(team);
      console.log(`[Seeder] Default demo team "${demoTeamName}" created.`);
    } else {
      console.log(`[Seeder] Demo team "${demoTeamName}" already exists.`);
    }

    // 3. Seed Demo Admin
    const demoAdminName = 'demo-admin';
    const existingDemoAdmin = await findTeamByName(demoAdminName);
    if (!existingDemoAdmin) {
      console.log(`[Seeder] Admin "${demoAdminName}" not found. Creating default demo admin...`);
      const hashed = await bcrypt.hash('password123', 10);
      const admin = new TeamModel({
        teamName: demoAdminName,
        password: hashed,
        role: 'admin',
        currentQuestion: 1,
        lastCorrectAnswerTimestamp: null,
        finishTime: null,
        members: []
      });
      await createTeam(admin);
      console.log(`[Seeder] Default demo admin "${demoAdminName}" created.`);
    } else {
      console.log(`[Seeder] Demo admin "${demoAdminName}" already exists.`);
    }
  } catch (error) {
    console.error('[Seeder] Database seeding encountered an error:', error);
  }
}

module.exports = { seedShowcaseData };
