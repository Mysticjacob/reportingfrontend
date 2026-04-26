import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER',
  appId: 'YOUR_APP_ID',
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
