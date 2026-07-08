import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN !== 'gen-lang-client-0750545962.firebaseapp.com' ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : 'studioflow-8969e.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'gen-lang-client-0750545962' ? import.meta.env.VITE_FIREBASE_PROJECT_ID : 'studioflow-8969e',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const messaging = getMessaging(app);

import { getToken } from 'firebase/messaging';

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Nota: Em produção seria necessário passar o vapidKey no getToken
      const token = await getToken(messaging, { vapidKey: 'BMD-nQyN_a2-x7L9t7yQ4aWkGqR5qZgT8xJpYx_aFmD8qMvNw2e1rZtJqMvN' }).catch(() => null);
      if (token) {
        console.log('FCM Token:', token);
        return token;
      }
    }
    return null;
  } catch (error) {
    console.error('Erro ao pedir permissão de notificação', error);
    return null;
  }
};
