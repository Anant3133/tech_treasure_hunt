const { body, validationResult, param } = require('express-validator');
const {
  createOrUpdateQuestion,
  deleteQuestionByNumber,
  listQuestions,
  getAllTeamsSorted,
  updateTeamProgress,
} = require('../services/firestore.service');
const questionCache = require('../services/questionCache');
const { generateToken, DEFAULT_TTL_SECONDS } = require('../services/qr.service');
const QRCode = require('qrcode');

console.log('[Controller] admin.controller.js loaded');

// -------------------- VALIDATIONS --------------------
const upsertQuestionValidations = [
  body('questionNumber').isInt({ min: 1 }).withMessage('questionNumber must be a positive integer'),
  body('text').isString().notEmpty(),
  body('answer').isString().notEmpty(),
  body('hint').isString().optional({ nullable: true }).default(''),
];

const deleteQuestionValidations = [
  param('questionNumber').isInt({ min: 1 }),
];

const resetTeamProgressValidations = [
  param('teamId').isString().notEmpty(),
  body('currentQuestion').optional().isInt({ min: 1 }),
];

const getCurrentQrTokenValidations = [
  param('questionNumber').isInt({ min: 1 }),
];

const getQRImageValidations = [
  param('questionNumber').isInt({ min: 1 }),
];

// -------------------- CONTROLLERS --------------------
async function upsertQuestion(req, res) {
  console.log('[upsertQuestion] body:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[upsertQuestion] validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const created = await createOrUpdateQuestion(req.body);
    // Invalidate cache for this question
    if (req.body && req.body.questionNumber) {
      questionCache.del(String(req.body.questionNumber));
    } else {
      questionCache.flushAll();
    }
    console.log('[upsertQuestion] created question:', created);
    res.status(200).json(created);
  } catch (err) {
    console.error('[upsertQuestion] Firestore error:', err);
    if (err.message && err.message.includes('already exists')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Failed to upsert question' });
  }
}

async function removeQuestionById(req, res) {
  const { questionId } = req.params;
  try {
    const ok = await require('../services/firestore.service').deleteQuestionById(questionId);
    if (!ok) return res.status(404).json({ message: 'Question not found' });
    questionCache.flushAll();
    res.json({ success: true });
  } catch (err) {
    console.error('[removeQuestionById] Firestore error:', err);
    res.status(500).json({ message: 'Failed to remove question' });
  }
}

async function removeQuestion(req, res) {
  console.log('[removeQuestion] params:', req.params);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[removeQuestion] validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const qNum = Number(req.params.questionNumber);
    const ok = await deleteQuestionByNumber(qNum);
    if (!ok) {
      console.log('[removeQuestion] Question not found');
      return res.status(404).json({ message: 'Question not found' });
    }
    // Invalidate cache for this question
    questionCache.del(String(qNum));
    console.log('[removeQuestion] Question deleted successfully');
    res.json({ success: true });
  } catch (err) {
    console.error('[removeQuestion] Firestore error:', err);
    res.status(500).json({ message: 'Failed to remove question' });
  }
}

async function getQuestions(req, res) {
  console.log('[getQuestions] called');
  try {
    const list = await listQuestions();
    console.log('[getQuestions] returning questions count:', list.length);
    res.json(list);
  } catch (err) {
    console.error('[getQuestions] Firestore error:', err);
    res.status(500).json({ message: 'Failed to get questions' });
  }
}

async function getTeams(req, res) {
  console.log('[getTeams] called');
  try {
    const teams = await getAllTeamsSorted();
    console.log('[getTeams] teams found:', teams.length);
    const sanitized = teams.map(t => ({
      id: t.id,
      teamName: t.teamName,
      role: t.role || 'participant',
      currentQuestion: t.currentQuestion || 0,
      finishTime: t.finishTime || null
    }));
    res.json(sanitized);
  } catch (err) {
    console.error('[getTeams] Firestore error:', err);
    res.status(500).json({ message: 'Failed to get teams' });
  }
}

async function resetTeamProgress(req, res) {
  console.log('[resetTeamProgress] params:', req.params, 'body:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[resetTeamProgress] validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { teamId } = req.params;
    const { currentQuestion = 1 } = req.body;
    const updated = await updateTeamProgress(teamId, { currentQuestion, finishTime: null });
    console.log('[resetTeamProgress] team updated:', updated);
    res.json({ id: updated.id, currentQuestion: updated.currentQuestion, finishTime: updated.finishTime || null });
  } catch (err) {
    console.error('[resetTeamProgress] Firestore error:', err);
    res.status(500).json({ message: 'Failed to reset team progress' });
  }
}

async function getCurrentQrToken(req, res) {
  console.log('[getCurrentQrToken] params:', req.params);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[getCurrentQrToken] validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const q = Number(req.params.questionNumber);
    const token = generateToken(q);
    console.log('[getCurrentQrToken] generated token:', token);
    res.json({ token, ttlSeconds: DEFAULT_TTL_SECONDS, questionNumber: q });
  } catch (err) {
    console.error('[getCurrentQrToken] QR token generation error:', err);
    res.status(500).json({ message: 'Failed to generate QR token' });
  }
}

const getQRImage = async (req, res) => {
  console.log('[getQRImage] params:', req.params);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[getQRImage] validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const q = Number(req.params.questionNumber);
    const token = generateToken(q);
    console.log('[getQRImage] token:', token);

    const qrCodeDataURL = await QRCode.toDataURL(token, {
      width: 256,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    console.log('[getQRImage] QR code generated');
    res.json({ token, questionNumber: q, qrCodeImage: qrCodeDataURL, ttlSeconds: DEFAULT_TTL_SECONDS });
  } catch (err) {
    console.error('[getQRImage] QR image generation error:', err);
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
};

const getQRPreview = async (req, res) => {
  console.log('[getQRPreview] params:', req.params);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[getQRPreview] validation errors:', errors.array());
    return res.status(400).send('Valid question number required');
  }

  try {
    const q = Number(req.params.questionNumber);
    const token = generateToken(q);
    console.log('[getQRPreview] token:', token);

    const qrCodeDataURL = await QRCode.toDataURL(token, { width: 256 });
    console.log('[getQRPreview] QR code generated');

    const html = `
      <html>
        <body style="text-align: center; font-family: Arial;">
          <h2>QR Code for Question ${q}</h2>
          <img src="${qrCodeDataURL}" alt="QR Code" />
          <p><strong>Token:</strong> ${token}</p>
          <p><strong>TTL:</strong> ${DEFAULT_TTL_SECONDS} seconds</p>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('[getQRPreview] QR preview generation error:', err);
    res.status(500).send('Error generating QR code');
  }
};

// -------------------- EXPORTS --------------------
module.exports = {
  upsertQuestion,
  upsertQuestionValidations,
  removeQuestion,
  deleteQuestionValidations,
  getQuestions,
  getTeams,
  resetTeamProgress,
  resetTeamProgressValidations,
  getCurrentQrToken,
  getCurrentQrTokenValidations,
  getQRImage,
  getQRImageValidations,
  getQRPreview, // ✅ ensured correctly exported
};
