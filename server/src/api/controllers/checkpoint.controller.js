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
  
  // For checkpoint 3 (after Q12), this is the final checkpoint - mark as finished
  if (checkpoint === 3) {
    const updates = {
      [checkpointField]: now,
      awaitingCheckpoint: null,
      isPaused: false, // No pause needed, game is finished
      finishTime: now,
    };

    await updateTeamProgress(teamId, updates);

    return res.json({
      success: true,
      message: 'Final checkpoint scanned! Hunt completed!',
      finished: true,
      paused: false,
    });
  }

  // For checkpoints 1 and 2, determine next question
  const nextQuestionAfterCheckpoint = {
    1: 5,  // After Q4 checkpoint, go to Q5
    2: 9,  // After Q8 checkpoint, go to Q9
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

// Admin: Unpause all paused teams
async function unpauseAllTeams(req, res) {
  try {
    const admin = require('firebase-admin');
    const db = admin.firestore();
    
    // Find all paused teams
    const teamsSnapshot = await db.collection('teams')
      .where('isPaused', '==', true)
      .get();

    if (teamsSnapshot.empty) {
      return res.json({ 
        success: true, 
        message: 'No paused teams found',
        unpausedCount: 0 
      });
    }

    // Batch update all paused teams
    const batch = db.batch();
    teamsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isPaused: false });
    });

    await batch.commit();

    return res.json({ 
      success: true, 
      message: `Unpaused ${teamsSnapshot.size} team(s)`,
      unpausedCount: teamsSnapshot.size
    });
  } catch (error) {
    console.error('Error unpausing all teams:', error);
    return res.status(500).json({ 
      message: 'Failed to unpause all teams',
      error: error.message 
    });
  }
}

module.exports = {
  scanCheckpoint,
  pauseTeam,
  unpauseTeam,
  unpauseAllTeams,
};
