// Firestore document model for reference
// { teamName: string, password: string(hash), currentQuestion: number, lastCorrectAnswerTimestamp: Timestamp, finishTime: Timestamp|null, isPaused: boolean, awaitingCheckpoint: number|null, checkpoint1Time: Timestamp|null, checkpoint2Time: Timestamp|null, checkpoint3Time: Timestamp|null }


class TeamModel {
  constructor(data) {
    this.teamName = String(data.teamName || '');
    this.password = String(data.password || '');
    this.currentQuestion = Number(data.currentQuestion || 1);
    this.lastCorrectAnswerTimestamp = data.lastCorrectAnswerTimestamp || null;
    this.finishTime = data.finishTime || null;
    this.role = data.role === 'admin' ? 'admin' : 'participant';
    // members: array of { name, contact }
    this.members = Array.isArray(data.members) ? data.members.slice(0, 4) : [];
    // Checkpoint system
    this.isPaused = Boolean(data.isPaused || false);
    this.awaitingCheckpoint = data.awaitingCheckpoint || null; // 1, 2, or 3
    this.checkpoint1Time = data.checkpoint1Time || null;
    this.checkpoint2Time = data.checkpoint2Time || null;
    this.checkpoint3Time = data.checkpoint3Time || null;
  }

  toPlain() {
    return {
      teamName: String(this.teamName || '').toLowerCase(),
      password: this.password,
      currentQuestion: this.currentQuestion,
      lastCorrectAnswerTimestamp: this.lastCorrectAnswerTimestamp,
      finishTime: this.finishTime,
      role: this.role,
      members: this.members,
      isPaused: this.isPaused,
      awaitingCheckpoint: this.awaitingCheckpoint,
      checkpoint1Time: this.checkpoint1Time,
      checkpoint2Time: this.checkpoint2Time,
      checkpoint3Time: this.checkpoint3Time,
    };
  }
}

module.exports = { TeamModel };


