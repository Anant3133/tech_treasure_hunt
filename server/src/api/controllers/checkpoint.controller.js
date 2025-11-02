const admin = require('firebase-admin');
const { findTeamById, updateTeamProgress } = require('../services/firestore.service');

// Scan checkpoint QR code
async function scanCheckpoint(req, res) {
  const { teamId } = req.team;
  const { checkpointNumber } = req.params; // 1, 2, or 3

  const checkpoint = Number(checkpointNumber);
  if (![1, 2, 3].includes(checkpoint)) {
    return res.status(400).json({ message: 'Invalid checkpoint number' });
  }

  const team = await findTeamById(teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  // Check if team is actually awaiting this checkpoint
  if (team.awaitingCheckpoint !== checkpoint) {
    return res.status(400).json({ 
      message: `Not awaiting checkpoint ${checkpoint}`,
      awaitingCheckpoint: team.awaitingCheckpoint 
    });
  }

  const now = admin.firestore.Timestamp.now();
  const checkpointField = `checkpoint${checkpoint}Time`;
  
  // Determine next question after checkpoint
  const nextQuestionAfterCheckpoint = {
    1: 5,  // After Q4 checkpoint, go to Q5
    2: 9,  // After Q8 checkpoint, go to Q9
    3: 13, // After Q12 checkpoint, go to Q13
  };

  const updates = {
    [checkpointField]: now,
    awaitingCheckpoint: null,
    isPaused: true, // Auto-pause after checkpoint scan
    currentQuestion: nextQuestionAfterCheckpoint[checkpoint],
  };

  await updateTeamProgress(teamId, updates);

  return res.json({
    success: true,
    message: `Checkpoint ${checkpoint} scanned successfully`,
    paused: true,
    nextQuestion: nextQuestionAfterCheckpoint[checkpoint],
  });
}

// Admin: Pause a team
async function pauseTeam(req, res) {
  const { teamId } = req.params;

  const team = await findTeamById(teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  await updateTeamProgress(teamId, { isPaused: true });

  return res.json({ success: true, message: 'Team paused', teamId });
}

// Admin: Unpause a team
async function unpauseTeam(req, res) {
  const { teamId } = req.params;

  const team = await findTeamById(teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  await updateTeamProgress(teamId, { isPaused: false });

  return res.json({ success: true, message: 'Team unpaused', teamId });
}

module.exports = {
  scanCheckpoint,
  pauseTeam,
  unpauseTeam,
};
