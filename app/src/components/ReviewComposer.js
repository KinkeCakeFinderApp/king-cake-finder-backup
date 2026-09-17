import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import KingCakeRating from '@/src/components/KingCakeRating';
import Button from '@/src/components/Button';
import RecaptchaModal from '@/src/components/RecaptchaModal';
import { submitReview } from '@/src/services/reviews';
import { REVIEW_MAX_CHARS } from '@/src/config/appConfig';
import { verifyRecaptchaToken } from '@/src/utils/recaptcha';

/**
 * Review composer shown at the bottom of a bakery page (or in edit mode). The
 * rating control sits ABOVE the text box, which is hard-capped at 500 chars
 * with a live counter. Submission runs reCAPTCHA first, then auto-moderation
 * inside submitReview().
 */
export default function ReviewComposer({
  bakeryId,
  existingReview,
  onSubmitted,
  onCancelEdit,
  onFocusInput,
}) {
  const { colors, spacing, typography, radius } = useTheme();
  const { user, profile } = useAuth();

  const [rating, setRating] = useState(existingReview ? existingReview.rating : 0);
  const [text, setText] = useState(existingReview ? existingReview.text : '');
  const [submitting, setSubmitting] = useState(false);
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!existingReview;
  const remaining = REVIEW_MAX_CHARS - text.length;

  const startSubmit = () => {
    setError(null);
    if (rating < 1) {
      setError('Tap the king cakes to choose a rating first.');
      return;
    }
    // Bot check must pass before we post anything.
    setCaptchaVisible(true);
  };

  const handleVerified = async (token) => {
    setCaptchaVisible(false);
    setSubmitting(true);
    setError(null);
    try {
      const verified = await verifyRecaptchaToken(token);
      if (!verified) {
        setError('Bot check failed to verify. Please try again.');
        setSubmitting(false);
        return;
      }
      const { status, moderation } = await submitReview({
        bakeryId,
        uid: user.uid,
        username: profile?.username || 'user',
        rating,
        text,
      });

      if (status === 'moderated') {
        Alert.alert(
          'Thanks — pending review',
          `Your review mentioned something our filter flagged (${
            moderation.reason || 'inappropriate content'
          }). It's been sent to our moderators and isn't public yet. You'll hear back in your inbox.`
        );
      }
      if (onSubmitted) onSubmitted(status);
    } catch (e) {
      setError(e.message || 'Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg },
      ]}
    >
      <Text style={[typography.heading, { color: colors.text }]}>
        {isEditing ? 'Edit your review' : 'Write a review'}
      </Text>

      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
        Rate this bakery's king cakes
      </Text>

      <View style={{ marginTop: spacing.md, marginBottom: spacing.md }}>
        <KingCakeRating value={rating} interactive onChange={setRating} size={18} gap={8} />
      </View>

      <View
        style={[
          styles.textWrap,
          { backgroundColor: colors.inputBg, borderColor: colors.border, borderRadius: radius.md },
        ]}
      >
        <TextInput
          style={[typography.body, styles.input, { color: colors.text }]}
          placeholder="Share what made their king cake great (or not)…"
          placeholderTextColor={colors.textFaint}
          value={text}
          onChangeText={(t) => setText(t.slice(0, REVIEW_MAX_CHARS))}
          onFocus={onFocusInput}
          multiline
          maxLength={REVIEW_MAX_CHARS}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.counterRow}>
        <Text
          style={[
            typography.caption,
            { color: remaining <= 25 ? colors.danger : colors.textFaint },
          ]}
        >
          {remaining} characters left
        </Text>
      </View>

      {error ? (
        <Text style={[typography.small, { color: colors.danger, marginBottom: spacing.sm }]}>
          {error}
        </Text>
      ) : null}

      <View style={styles.buttonRow}>
        {isEditing && onCancelEdit ? (
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Button title="Cancel" variant="ghost" onPress={onCancelEdit} disabled={submitting} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Button
            title={isEditing ? 'Save changes' : 'Post review'}
            icon="send"
            onPress={startSubmit}
            loading={submitting}
          />
        </View>
      </View>

      <Text style={[typography.caption, { color: colors.textFaint, marginTop: spacing.sm }]}>
        Reviews are auto-checked to keep things PG. A bot check runs before posting.
      </Text>

      <RecaptchaModal
        visible={captchaVisible}
        onVerify={handleVerified}
        onClose={() => setCaptchaVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  textWrap: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, minHeight: 110 },
  input: { minHeight: 90, padding: 0 },
  counterRow: { alignItems: 'flex-end', marginTop: 6, marginBottom: 10 },
  buttonRow: { flexDirection: 'row', alignItems: 'center' },
});
