// Firestore document model for reference
// { questionNumber: number, text: string, answer: string, hint: string, imageUrl: string, links: array }

class QuestionModel {
  constructor(data) {
    this.questionNumber = Number(data.questionNumber);
    this.text = String(data.text || '');
    this.answer = String(data.answer || '');
    this.hint = String(data.hint || '');
    this.imageUrl = String(data.imageUrl || ''); // Optional image URL
    this.links = Array.isArray(data.links) ? data.links : []; // Array of {text, url}
  }
}

module.exports = { QuestionModel };


