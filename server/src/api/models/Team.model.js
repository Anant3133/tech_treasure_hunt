// Firestore document model for reference
// { teamName: string, password: string(hash), currentQuestion: number, lastCorrectAnswerTimestamp: Timestamp, finishTime: Timestamp|null }

class TeamModel {
  constructor(data) {
    this.teamName = String(data.teamName || '');
    this.password = String(data.password || '');
    this.currentQuestion = Number(data.currentQuestion || 1);
    this.lastCorrectAnswerTimestamp = data.lastCorrectAnswerTimestamp || null;
    this.finishTime = data.finishTime || null;
    this.role = data.role === 'admin' ? 'admin' : 'participant';
  }

  toPlain() {
    return {
      // store teamName normalized to lowercase to avoid case-sensitivity issues
      teamName: String(this.teamName || '').toLowerCase(),
      password: this.password,
      currentQuestion: this.currentQuestion,
      lastCorrectAnswerTimestamp: this.lastCorrectAnswerTimestamp,
      finishTime: this.finishTime,
      role: this.role,
    };
  }
}

module.exports = { TeamModel };


