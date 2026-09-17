import React, { useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { RECAPTCHA_SITE_KEY, RECAPTCHA_DOMAIN } from '@/src/config/appConfig';

/**
 * A React Native-compatible reCAPTCHA v2 ("I'm not a robot") checkbox rendered
 * inside a WebView. When the user solves it, the token is posted back to RN and
 * `onVerify(token)` fires; the caller then proceeds to submit the review.
 *
 * The sheet is FULL-SCREEN and the WebView scrolls, so the "select all images"
 * challenge that pops up after the checkbox has room to display and be solved on
 * a phone (a small fixed box would clip it). Spark-tier friendly: no Cloud
 * Function required.
 */
export default function RecaptchaModal({ visible, onVerify, onClose }) {
  const { colors, spacing, typography, isDark } = useTheme();

  const html = useMemo(
    () => buildHtml(RECAPTCHA_SITE_KEY, isDark ? 'dark' : 'light', colors.surface),
    [isDark, colors.surface]
  );

  const handleMessage = (event) => {
    let payload;
    try {
      payload = JSON.parse(event.nativeEvent.data);
    } catch (e) {
      return;
    }
    if (payload.type === 'token' && payload.token) {
      onVerify(payload.token);
    } else if (payload.type === 'expired' || payload.type === 'error') {
      // Leave the sheet open so the user can retry the checkbox.
    } else if (payload.type === 'close') {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        style={[styles.full, { backgroundColor: colors.surface }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.primary} />
            <Text style={[typography.heading, { color: colors.text, marginLeft: 8 }]}>
              Quick check
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text
          style={[
            typography.small,
            { color: colors.textMuted, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
          ]}
        >
          Tap the checkbox below and complete any picture puzzle that appears to
          confirm you're human, then your review will post.
        </Text>

        <WebView
          originWhitelist={['*']}
          source={{ html, baseUrl: RECAPTCHA_DOMAIN }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled
          bounces={false}
          style={styles.web}
          containerStyle={styles.web}
          mixedContentMode="always"
        />
      </SafeAreaView>
    </Modal>
  );
}

function buildHtml(siteKey, theme, bg) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit" async defer></script>
  <style>
    html,body{margin:0;padding:0;background:${bg};min-height:100%;}
    /* Push the checkbox toward the top so the image-challenge popup (which opens
       downward) has the rest of the screen to fill. */
    #wrap{display:flex;align-items:flex-start;justify-content:center;padding:24px 0;min-height:100vh;}
  </style>
</head>
<body>
  <div id="wrap"><div id="captcha"></div></div>
  <script>
    function post(o){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(o)); } }
    function onRecaptchaLoad(){
      try{
        grecaptcha.render('captcha', {
          sitekey: '${siteKey}',
          theme: '${theme}',
          callback: function(token){ post({type:'token', token:token}); },
          'expired-callback': function(){ post({type:'expired'}); },
          'error-callback': function(){ post({type:'error'}); }
        });
      }catch(e){ post({type:'error', message: String(e)}); }
    }
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  web: { flex: 1, backgroundColor: 'transparent' },
});
