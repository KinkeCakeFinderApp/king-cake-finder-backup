import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  deleteUser,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/src/firebase/config';
import {
  createUserProfile,
  addFavorite,
  removeFavorite,
  addToTaste,
  removeToTaste,
  addBlockedUser,
  removeBlockedUser,
  deleteUserData,
  savePushToken,
} from '@/src/services/users';
import { registerForPushNotificationsAsync } from '@/src/utils/pushNotifications';
import { useTheme } from '@/src/context/ThemeContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { setThemeMode } = useTheme();
  const [user, setUser] = useState(null); // Firebase auth user
  const [profile, setProfile] = useState(null); // Firestore profile doc
  const [initializing, setInitializing] = useState(true);
  // Guest mode: browse bakeries & reviews without an account. Account-only
  // features (review, favorite, inbox, history, support) prompt a sign-in.
  const [guest, setGuest] = useState(false);
  const profileUnsub = useRef(null);
  const lastAppliedTheme = useRef(null);
  const pushRegisteredFor = useRef(null);

  // Listen for auth state; when signed in, live-subscribe to the profile doc so
  // favorites / role / theme stay in sync everywhere without re-fetching.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      // Tear down any previous profile subscription.
      if (profileUnsub.current) {
        profileUnsub.current();
        profileUnsub.current = null;
      }

      setUser(fbUser || null);

      if (!fbUser) {
        setProfile(null);
        setInitializing(false);
        pushRegisteredFor.current = null;
        return;
      }

      // A real sign-in supersedes guest browsing.
      setGuest(false);

      profileUnsub.current = onSnapshot(
        doc(db, 'users', fbUser.uid),
        (snap) => {
          if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() };
            setProfile(data);
            // Apply the user's saved theme once (avoid fighting manual toggles).
            if (data.theme && data.theme !== lastAppliedTheme.current) {
              lastAppliedTheme.current = data.theme;
              setThemeMode(data.theme);
            }
            // Register this device's push token once per sign-in (not on
            // every snapshot re-fire from unrelated profile changes).
            if (pushRegisteredFor.current !== fbUser.uid) {
              pushRegisteredFor.current = fbUser.uid;
              registerForPushNotificationsAsync()
                .then((token) => {
                  if (token) savePushToken(fbUser.uid, token, data.role === 'superuser');
                })
                .catch(() => {});
            }
          } else {
            setProfile(null);
          }
          setInitializing(false);
        },
        () => {
          setInitializing(false);
        }
      );
    });

    return () => {
      unsub();
      if (profileUnsub.current) profileUnsub.current();
    };
    // setThemeMode is stable (useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = useCallback(async (fields) => {
    const { email, password, username, firstName, lastName } = fields;
    const cred = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    // Everyone signs up as a normal user. Superusers are provisioned by hand in
    // the Firebase console (set role: "superuser" on the user doc) — the client
    // can never grant admin, and the security rules enforce this too.
    await updateProfile(cred.user, { displayName: username.trim() }).catch(() => {});
    await createUserProfile(cred.user.uid, {
      username,
      firstName,
      lastName,
      email,
      role: 'user',
    });
  }, []);

  const logIn = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  /** Sends a password-reset email so the user can choose a new password. */
  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const logOut = useCallback(async () => {
    lastAppliedTheme.current = null;
    setGuest(false);
    await fbSignOut(auth);
  }, []);

  // Enter/leave guest browsing (no account). Used by the welcome screen and the
  // sign-in prompts shown on account-only actions.
  const enterGuest = useCallback(() => setGuest(true), []);
  const exitGuest = useCallback(() => setGuest(false), []);

  const toggleFavorite = useCallback(
    async (bakeryId) => {
      if (!user || !profile) return;
      const isFav = Array.isArray(profile.favorites)
        ? profile.favorites.includes(bakeryId)
        : false;
      // Optimistic local update; the snapshot listener will confirm.
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              favorites: isFav
                ? (prev.favorites || []).filter((id) => id !== bakeryId)
                : [...(prev.favorites || []), bakeryId],
            }
          : prev
      );
      try {
        if (isFav) await removeFavorite(user.uid, bakeryId);
        else await addFavorite(user.uid, bakeryId);
      } catch (e) {
        // Revert on failure.
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                favorites: isFav
                  ? [...(prev.favorites || []), bakeryId]
                  : (prev.favorites || []).filter((id) => id !== bakeryId),
              }
            : prev
        );
        throw e;
      }
    },
    [user, profile]
  );

  const isFavorite = useCallback(
    (bakeryId) =>
      !!(profile && Array.isArray(profile.favorites) && profile.favorites.includes(bakeryId)),
    [profile]
  );

  /** "To be tasted" wishlist — separate from favorites, for bakeries the user
   * wants to try later. Same optimistic-update pattern as toggleFavorite. */
  const toggleToTaste = useCallback(
    async (bakeryId) => {
      if (!user || !profile) return;
      const isSaved = Array.isArray(profile.toTaste)
        ? profile.toTaste.includes(bakeryId)
        : false;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              toTaste: isSaved
                ? (prev.toTaste || []).filter((id) => id !== bakeryId)
                : [...(prev.toTaste || []), bakeryId],
            }
          : prev
      );
      try {
        if (isSaved) await removeToTaste(user.uid, bakeryId);
        else await addToTaste(user.uid, bakeryId);
      } catch (e) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                toTaste: isSaved
                  ? [...(prev.toTaste || []), bakeryId]
                  : (prev.toTaste || []).filter((id) => id !== bakeryId),
              }
            : prev
        );
        throw e;
      }
    },
    [user, profile]
  );

  const isToTaste = useCallback(
    (bakeryId) =>
      !!(profile && Array.isArray(profile.toTaste) && profile.toTaste.includes(bakeryId)),
    [profile]
  );

  /** The uids this user has blocked (their reviews are hidden from this user). */
  const blockedUsers = Array.isArray(profile?.blockedUsers) ? profile.blockedUsers : [];

  const isBlocked = useCallback(
    (uid) => blockedUsers.some((b) => b.uid === uid),
    [blockedUsers]
  );

  /**
   * Blocks another user so their reviews no longer appear for this user (UGC
   * safety requirement). Stores {uid, username} so the block list is readable in
   * Settings. Optimistic; the profile snapshot confirms.
   */
  const blockUser = useCallback(
    async (blockedUid, username) => {
      if (!user || !blockedUid || blockedUid === user.uid) return;
      if (blockedUsers.some((b) => b.uid === blockedUid)) return;
      const entry = { uid: blockedUid, username: username || 'user' };
      setProfile((prev) =>
        prev ? { ...prev, blockedUsers: [...(prev.blockedUsers || []), entry] } : prev
      );
      try {
        await addBlockedUser(user.uid, entry);
      } catch (e) {
        setProfile((prev) =>
          prev
            ? { ...prev, blockedUsers: (prev.blockedUsers || []).filter((b) => b.uid !== blockedUid) }
            : prev
        );
        throw e;
      }
    },
    [user, blockedUsers]
  );

  const unblockUser = useCallback(
    async (entry) => {
      if (!user || !entry) return;
      setProfile((prev) =>
        prev ? { ...prev, blockedUsers: (prev.blockedUsers || []).filter((b) => b.uid !== entry.uid) } : prev
      );
      try {
        await removeBlockedUser(user.uid, entry);
      } catch (e) {
        setProfile((prev) =>
          prev ? { ...prev, blockedUsers: [...(prev.blockedUsers || []), entry] } : prev
        );
        throw e;
      }
    },
    [user]
  );

  /**
   * Deletes the account (store-compliance requirement). Re-authenticates with
   * the current password, removes the user's own Firestore content, then the
   * auth account itself.
   */
  const deleteAccount = useCallback(
    async (password) => {
      const current = auth.currentUser;
      if (!current) throw new Error('You are not signed in.');
      if (password && current.email) {
        const credential = EmailAuthProvider.credential(current.email, password);
        await reauthenticateWithCredential(current, credential);
      }
      await deleteUserData(current.uid);
      await deleteUser(current);
    },
    []
  );

  const value = {
    user,
    profile,
    initializing,
    isAuthenticated: !!user,
    isSuperuser: !!(profile && profile.role === 'superuser'),
    isGuest: guest,
    // Anyone allowed past the welcome screen: a signed-in user OR a guest.
    canBrowse: !!user || guest,
    signUp,
    logIn,
    resetPassword,
    logOut,
    enterGuest,
    exitGuest,
    toggleFavorite,
    isFavorite,
    toggleToTaste,
    isToTaste,
    blockedUsers,
    isBlocked,
    blockUser,
    unblockUser,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
