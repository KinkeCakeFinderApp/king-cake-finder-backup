import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut,
  onAuthStateChanged, deleteUser, updateProfile, EmailAuthProvider, reauthenticateWithCredential,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { createUserProfile, addFavorite, removeFavorite, addToTaste, removeToTaste, addBlockedUser, removeBlockedUser, deleteUserData } from '../services/users';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const profileUnsub = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (profileUnsub.current) { profileUnsub.current(); profileUnsub.current = null; }
      setUser(fbUser || null);
      if (!fbUser) { setProfile(null); setInitializing(false); return; }
      profileUnsub.current = onSnapshot(
        doc(db, 'users', fbUser.uid),
        (snap) => { setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null); setInitializing(false); },
        () => setInitializing(false)
      );
    });
    return () => { unsub(); if (profileUnsub.current) profileUnsub.current(); };
  }, []);

  const signUp = useCallback(async (fields) => {
    const { email, password, username, firstName, lastName } = fields;
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: username.trim() }).catch(() => {});
    await createUserProfile(cred.user.uid, { username, firstName, lastName, email, role: 'user' });
  }, []);

  const logIn = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const logOut = useCallback(async () => { await fbSignOut(auth); }, []);

  const isFavorite = useCallback(
    (bakeryId) => !!(profile && Array.isArray(profile.favorites) && profile.favorites.includes(bakeryId)),
    [profile]
  );

  const toggleFavorite = useCallback(async (bakeryId) => {
    if (!user || !profile) return;
    const isFav = isFavorite(bakeryId);
    setProfile((prev) => prev ? {
      ...prev,
      favorites: isFav ? (prev.favorites || []).filter((id) => id !== bakeryId) : [...(prev.favorites || []), bakeryId],
    } : prev);
    try {
      if (isFav) await removeFavorite(user.uid, bakeryId);
      else await addFavorite(user.uid, bakeryId);
    } catch (e) {
      setProfile((prev) => prev ? {
        ...prev,
        favorites: isFav ? [...(prev.favorites || []), bakeryId] : (prev.favorites || []).filter((id) => id !== bakeryId),
      } : prev);
      throw e;
    }
  }, [user, profile, isFavorite]);

  const isToTaste = useCallback(
    (bakeryId) => !!(profile && Array.isArray(profile.toTaste) && profile.toTaste.includes(bakeryId)),
    [profile]
  );

  const toggleToTaste = useCallback(async (bakeryId) => {
    if (!user || !profile) return;
    const isSaved = isToTaste(bakeryId);
    setProfile((prev) => prev ? {
      ...prev,
      toTaste: isSaved ? (prev.toTaste || []).filter((id) => id !== bakeryId) : [...(prev.toTaste || []), bakeryId],
    } : prev);
    try {
      if (isSaved) await removeToTaste(user.uid, bakeryId);
      else await addToTaste(user.uid, bakeryId);
    } catch (e) {
      setProfile((prev) => prev ? {
        ...prev,
        toTaste: isSaved ? [...(prev.toTaste || []), bakeryId] : (prev.toTaste || []).filter((id) => id !== bakeryId),
      } : prev);
      throw e;
    }
  }, [user, profile, isToTaste]);

  const blockedUsers = Array.isArray(profile?.blockedUsers) ? profile.blockedUsers : [];

  const isBlocked = useCallback((uid) => blockedUsers.some((b) => b.uid === uid), [blockedUsers]);

  const blockUser = useCallback(async (blockedUid, username) => {
    if (!user || !blockedUid || blockedUid === user.uid) return;
    if (blockedUsers.some((b) => b.uid === blockedUid)) return;
    const entry = { uid: blockedUid, username: username || 'user' };
    setProfile((prev) => prev ? { ...prev, blockedUsers: [...(prev.blockedUsers || []), entry] } : prev);
    try {
      await addBlockedUser(user.uid, entry);
    } catch (e) {
      setProfile((prev) => prev ? { ...prev, blockedUsers: (prev.blockedUsers || []).filter((b) => b.uid !== blockedUid) } : prev);
      throw e;
    }
  }, [user, blockedUsers]);

  const unblockUser = useCallback(async (entry) => {
    if (!user || !entry) return;
    setProfile((prev) => prev ? { ...prev, blockedUsers: (prev.blockedUsers || []).filter((b) => b.uid !== entry.uid) } : prev);
    try {
      await removeBlockedUser(user.uid, entry);
    } catch (e) {
      setProfile((prev) => prev ? { ...prev, blockedUsers: [...(prev.blockedUsers || []), entry] } : prev);
      throw e;
    }
  }, [user]);

  const deleteAccount = useCallback(async (password) => {
    const current = auth.currentUser;
    if (!current) throw new Error('You are not signed in.');
    if (password && current.email) {
      await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, password));
    }
    await deleteUserData(current.uid);
    await deleteUser(current);
  }, []);

  const value = {
    user, profile, initializing,
    isAuthenticated: !!user,
    isSuperuser: !!(profile && profile.role === 'superuser'),
    signUp, logIn, resetPassword, logOut, toggleFavorite, isFavorite,
    toggleToTaste, isToTaste,
    blockedUsers, isBlocked, blockUser, unblockUser,
    deleteAccount,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
