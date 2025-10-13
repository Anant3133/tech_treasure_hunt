const admin = require('firebase-admin');

// Supports either FIREBASE_CREDENTIALS_JSON or the individual pieces
const { FIREBASE_CREDENTIALS_JSON, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

function getCredentials() {
  if (FIREBASE_CREDENTIALS_JSON) {
    try {
      // Accept both raw JSON and stringified JSON with \n in private_key
      const obj = JSON.parse(FIREBASE_CREDENTIALS_JSON);
      if (obj.private_key) obj.private_key = obj.private_key.replace(/\\n/g, '\n');
      return obj;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Invalid FIREBASE_CREDENTIALS_JSON. Expecting a valid JSON string.');
      return null;
    }
  }
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: (FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
  }
  return null;
}

if (!admin.apps.length) {
  const creds = getCredentials();
  if (!creds) {
    // eslint-disable-next-line no-console
    console.error('Firebase credentials not found in env. Set FIREBASE_CREDENTIALS_JSON or individual vars.');
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(creds),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize Firebase Admin SDK. Check your env vars.', err.message);
    }
  }
}

const db = admin.firestore ? admin.firestore() : null;

module.exports = { admin, db };


