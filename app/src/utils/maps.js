import { Linking, Platform, Alert } from 'react-native';

function encode(value) {
  return encodeURIComponent(String(value || '').trim());
}

/**
 * Prefer routing to precise coordinates when we have them, otherwise fall back
 * to the free-text address so the maps app can geocode it itself.
 */
function destinationParam(address, coords) {
  if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
    return `${coords.lat},${coords.lng}`;
  }
  return encode(address);
}

export async function openInAppleMaps(address, coords) {
  const daddr = destinationParam(address, coords);
  const label = encode(address);
  // http://maps.apple.com deep link opens the Apple Maps app on iOS.
  const url = `http://maps.apple.com/?daddr=${daddr}&q=${label}`;
  await openUrl(url);
}

export async function openInGoogleMaps(address, coords) {
  const destination = destinationParam(address, coords);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  await openUrl(url);
}

export async function callPhone(phone) {
  const cleaned = String(phone || '').replace(/[^\d+]/g, '');
  if (!cleaned) return;
  const url = `${Platform.OS === 'android' ? 'tel:' : 'telprompt:'}${cleaned}`;
  await openUrl(url, `tel:${cleaned}`);
}

export async function openEmail(email, subject) {
  const url = `mailto:${encode(email)}${subject ? `?subject=${encode(subject)}` : ''}`;
  await openUrl(url);
}

async function openUrl(url, fallback) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else if (fallback) {
      await Linking.openURL(fallback);
    } else {
      Alert.alert('Unable to open', 'Your device could not open that link.');
    }
  } catch (e) {
    Alert.alert('Something went wrong', 'We could not open that link right now.');
  }
}
