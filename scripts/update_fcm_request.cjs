const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

if (!code.includes('requestNotificationPermission')) {
  code = code + `
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
`;
  fs.writeFileSync('src/lib/firebase.ts', code);
}
