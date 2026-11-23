// Жергілікті ескертулер (дәрі қабылдау, күнделікті жазба). Қате болса қосымша құламайды.
let N = null;
try { N = require('expo-notifications'); } catch (e) { N = null; }

export function initNotifications() {
  try {
    N?.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
  } catch (e) {}
}

async function ensurePermission() {
  try {
    const cur = await N.getPermissionsAsync();
    if (cur.status === 'granted') return true;
    const req = await N.requestPermissionsAsync();
    return req.status === 'granted';
  } catch (e) { return false; }
}

export async function scheduleDaily(identifier, title, body, time) {
  if (!N) return false;
  try {
    if (!(await ensurePermission())) return false;
    const [hour, minute] = time.split(':').map(Number);
    await N.cancelScheduledNotificationAsync(identifier).catch(() => {});
    await N.scheduleNotificationAsync({
      identifier,
      content: { title, body },
      trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    return true;
  } catch (e) {
    console.warn('Notification error', e);
    return false;
  }
}

export async function cancelNotification(identifier) {
  try { await N?.cancelScheduledNotificationAsync(identifier); } catch (e) {}
}
