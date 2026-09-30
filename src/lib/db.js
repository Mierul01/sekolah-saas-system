// Single import point every page uses for data access. When Firebase is
// configured (.env filled in) this re-exports the real firebase/firestore
// SDK; otherwise it transparently falls back to the localStorage-backed mock
// in localDb.js so the whole app works with zero setup. Pages never need to
// know which one is active.
import * as firestoreReal from 'firebase/firestore'
import * as local from './localDb'
import { firebaseReady, db as firebaseDb } from './firebase'

export const LOCAL_MODE = !firebaseReady

export const db = firebaseReady ? firebaseDb : local.db
export const collection = firebaseReady ? firestoreReal.collection : local.collection
export const doc = firebaseReady ? firestoreReal.doc : local.doc
export const query = firebaseReady ? firestoreReal.query : local.query
export const where = firebaseReady ? firestoreReal.where : local.where
export const orderBy = firebaseReady ? firestoreReal.orderBy : local.orderBy
export const addDoc = firebaseReady ? firestoreReal.addDoc : local.addDoc
export const setDoc = firebaseReady ? firestoreReal.setDoc : local.setDoc
export const getDoc = firebaseReady ? firestoreReal.getDoc : local.getDoc
export const getDocs = firebaseReady ? firestoreReal.getDocs : local.getDocs
export const deleteDoc = firebaseReady ? firestoreReal.deleteDoc : local.deleteDoc
export const onSnapshot = firebaseReady ? firestoreReal.onSnapshot : local.onSnapshot
export const serverTimestamp = firebaseReady ? firestoreReal.serverTimestamp : local.serverTimestamp
