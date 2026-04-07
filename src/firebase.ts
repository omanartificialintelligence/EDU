import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, collection, addDoc, onSnapshot, query, orderBy, getDocFromServer, doc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use initializeFirestore with settings for better reliability in some environments (like iframes)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Validation test connection
async function testConnection() {
  try {
    // Using a path allowed by the updated rules
    await getDocFromServer(doc(db, 'connection_test', 'status'));
    console.log("Firebase connection successful");
  } catch (error) {
    console.error("Firebase connection test error:", error);
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.error("Please check your Firebase configuration. The client is offline or the service is unavailable.");
    }
  }
}
testConnection();

export { collection, addDoc, onSnapshot, query, orderBy };
