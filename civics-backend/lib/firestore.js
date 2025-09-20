const admin = require('firebase-admin');

let db;

const initFirestore = () => {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      db = admin.firestore();
      console.log('✅ Firestore connected successfully.');
    } catch (error) {
      console.error('❌ Failed to initialize Firestore. Is FIREBASE_SERVICE_ACCOUNT a valid JSON string?', error);
    }
  } else {
    console.log('ℹ️ FIREBASE_SERVICE_ACCOUNT not provided. Firestore integration is disabled.');
  }
};

const isFirestoreActive = () => !!db;

const saveReport = async (id, reportData) => {
  if (!db) throw new Error('Firestore is not initialized.');
  const reportRef = db.collection('reports').doc(id);
  await reportRef.set(reportData);
  console.log(`📝 Report ${id} saved to Firestore.`);
};

const getReport = async (id) => {
  if (!db) throw new Error('Firestore is not initialized.');
  const doc = await db.collection('reports').doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data();
};

const updateReport = async (id, updateData) => {
  if (!db) throw new Error('Firestore is not initialized.');
  const reportRef = db.collection('reports').doc(id);
  await reportRef.update(updateData);
  console.log(`🔄 Report ${id} updated in Firestore.`);
};

module.exports = { initFirestore, isFirestoreActive, saveReport, getReport, updateReport };