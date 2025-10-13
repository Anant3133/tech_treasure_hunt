/*
  Usage:
  node scripts/seed-questions.js ./scripts/questions.sample.json
*/
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { createOrUpdateQuestion } = require('../src/api/services/firestore.service');

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Provide path to questions JSON.');
    process.exit(1);
  }
  const filePath = path.resolve(process.cwd(), fileArg);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) {
    console.error('JSON must be an array of questions');
    process.exit(1);
  }
  for (const q of list) {
    if (typeof q.questionNumber === 'undefined' || !q.text || !q.answer) {
      console.warn('Skipping invalid question:', q);
      continue;
    }
    const data = {
      questionNumber: Number(q.questionNumber),
      text: String(q.text),
      answer: String(q.answer),
      hint: q.hint ? String(q.hint) : '',
    };
    const saved = await createOrUpdateQuestion(data);
    console.log('Upserted question', saved.questionNumber);
  }
  console.log('Seeding complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


