// Firestore document model for reference
// { questionNumber: number, text: string, answer: string, hint: string }

class QuestionModel {
  constructor(data) {
    this.questionNumber = Number(data.questionNumber);
    this.text = String(data.text || '');
    this.answer = String(data.answer || '');
    this.hint = String(data.hint || '');
  }
}

module.exports = { QuestionModel };


