import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  getDocs,
  increment,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDh_T9P1-_oNfCO44GHTTBCZqNibUmI1U4",
  authDomain: "q-path.firebaseapp.com",
  projectId: "q-path",
  storageBucket: "q-path.firebasestorage.app",
  messagingSenderId: "14142318406",
  appId: "1:14142318406:web:4def7b3161b447af01a747",
  measurementId: "G-6LJXNBX2LW",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let readyPromise;

export function ensureFirebaseReady() {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
        return;
      }
      try {
        await signInAnonymously(auth);
      } catch (error) {
        unsubscribe();
        reject(error);
      }
    });
  });
  return readyPromise;
}

function subscribe(name, onData, onError) {
  return onSnapshot(
    collection(db, name),
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError
  );
}

export function subscribeClasses(onData, onError) {
  return subscribe("classes", onData, onError);
}

export function subscribeQuizzes(onData, onError) {
  return subscribe("quizzes", onData, onError);
}

export function subscribeComments(onData, onError) {
  return subscribe("comments", onData, onError);
}

export function saveClass(classroom) {
  return setDoc(doc(db, "classes", classroom.id), classroom, { merge: true });
}

export function saveQuiz(quiz) {
  return setDoc(doc(db, "quizzes", quiz.id), quiz, { merge: true });
}

export function saveComment(comment) {
  return setDoc(doc(db, "comments", comment.id), comment, { merge: true });
}

export async function findClassByCode(code) {
  const snapshot = await getDocs(query(collection(db, "classes"), where("code", "==", code)));
  if (snapshot.empty) return null;
  const item = snapshot.docs[0];
  return { id: item.id, ...item.data() };
}

export function increaseQuizSolvedCount(quizId) {
  return updateDoc(doc(db, "quizzes", quizId), { solvedCount: increment(1) });
}

export async function migrateLocalData({ classes, quizzes, comments }) {
  const writes = [];
  classes.forEach((item) => writes.push(saveClass(item)));
  quizzes.filter((item) => !item.id.startsWith("sample-")).forEach((item) => writes.push(saveQuiz(item)));
  comments.filter((item) => item.id !== "c1" && item.id !== "c2").forEach((item) => writes.push(saveComment(item)));
  await Promise.all(writes);
}
