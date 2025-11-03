import api from './http';

export async function getQuestion(questionNumber) {
  const { data } = await api.get(`/game/question/${questionNumber}`);
  return data; // { questionNumber, text, links, imageUrl }
}

export async function submitAnswer(submittedAnswer) {
  const { data } = await api.post('/game/submit-answer', { submittedAnswer });
  return data; // { correct, finished, requiresQrScan?, qrForQuestion?, nextHint?, currentQuestion }
}

export async function resolveQrToken(token) {
  const { data } = await api.post(`/qr/resolve/${encodeURIComponent(token)}`);
  return data; // { advanced, finished, currentQuestion }
}

export async function getTeamProgress() {
  const { data } = await api.get('/game/progress');
  return data; // { currentQuestion, finishTime }
}

export async function getTeamInfo() {
  const { data } = await api.get('/game/team');
  return data; // { teamName, members }
}


