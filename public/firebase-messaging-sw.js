importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyB99d9yrfRSmu-YfER6DRUBIrBABSQOGdY",
  authDomain: "studioflow-8969e.firebaseapp.com",
  projectId: "studioflow-8969e",
  storageBucket: "studioflow-8969e.firebasestorage.app",
  messagingSenderId: "145313798128",
  appId: "1:145313798128:web:63732360c15c4f2130ef35"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
