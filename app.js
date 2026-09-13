import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clipboard,
  Edit3,
  FileText,
  GraduationCap,
  Heart,
  House,
  KeyRound,
  Lightbulb,
  LockKeyhole,
  LogOut,
  Megaphone,
  MessageCircle,
  PencilLine,
  Plus,
  RotateCcw,
  School,
  Send,
  Sparkles,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import {
  ensureFirebaseReady,
  findClassByCode,
  increaseQuizSolvedCount,
  migrateLocalData,
  removeQuiz,
  removeUpdateNote,
  saveClass,
  saveComment,
  saveQuiz,
  saveUpdateNote,
  subscribeClasses,
  subscribeComments,
  subscribeQuizzes,
  subscribeUpdateNotes,
} from "./firebase.js?v=20260805-talk-profile-r2";

const h = React.createElement;
const APP_SCREENS = new Set(["role", "home", "profile", "quizzes", "answer", "create", "study", "dashboard", "edit", "updates"]);

function normalizeAnswerValue(value) {
  return String(value ?? "").normalize("NFKC").trim();
}

function getCorrectChoiceIndex(quiz) {
  const choices = Array.isArray(quiz?.choices) ? quiz.choices : [];
  const normalizedAnswer = normalizeAnswerValue(quiz?.correctAnswer);
  const textMatch = choices.findIndex((choice) => normalizeAnswerValue(choice) === normalizedAnswer);
  if (textMatch >= 0) return textMatch;

  const letterMatch = normalizedAnswer.toUpperCase().match(/^[A-D]$/);
  return letterMatch ? letterMatch[0].charCodeAt(0) - 65 : -1;
}

function isRetiredOyamaQuiz(quiz) {
  return [quiz?.title, quiz?.question, quiz?.author]
    .some((value) => normalizeAnswerValue(value).includes("おやま"));
}

function normalizeClassCode(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function normalizeUserId(value) {
  const normalized = String(value ?? "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[‐‑‒–—―ー−\s]/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 40);

  return /^[ST][A-Z0-9]{1,5}$/.test(normalized)
    ? `${normalized[0]}-${normalized.slice(1)}`
    : normalized;
}

const DEVELOPER_KEY_HASH = "73e5dc65dc4e27c582544ed16688a2f5eca044a03c62389ed5b5b02ed918ff7f";
const DEVELOPER_USER_ID = "D-QPATH";

function isDeveloperUserId(value) {
  return normalizeUserId(value) === DEVELOPER_USER_ID;
}

async function hashDeveloperKey(value) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("このブラウザでは開発者キーを確認できません。");
  }
  const data = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getScreenFromHash() {
  if (typeof window === "undefined") return "home";
  const value = window.location.hash.replace(/^#/, "");
  return APP_SCREENS.has(value) ? value : "home";
}

const STORAGE = {
  quizzes: "qpath.quizzes",
  profile: "qpath.profile",
  comments: "qpath.comments",
  membership: "qpath.membership",
  classes: "qpath.classes",
  classProfiles: "qpath.classProfiles",
  updateNotes: "qpath.updateNotes",
  developerAccess: "qpath.developerAccess",
};

const AVATAR_COLORS = ["#38aee0", "#62cfbd", "#7aa7ff", "#f59fb3", "#f2b84b", "#8ec96d"];
const DEFAULT_BIO_TEXT = "挑戦したことが学びです";

function pickAvatarColor(id = "") {
  const total = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[total % AVATAR_COLORS.length];
}

function normalizeBio(bio) {
  return bio && bio !== DEFAULT_BIO_TEXT ? bio : "";
}

const SUBJECT_OPTIONS = ["国語", "数学", "化学", "生物", "物理", "地学", "日本史", "世界史", "公民", "地理", "英語", "その他"];
const SUBJECT_ORDER = new Map(SUBJECT_OPTIONS.map((subject, index) => [subject, index]));

function getSubjectGroups(quizzes) {
  const counts = quizzes.reduce((items, quiz) => {
    const subject = quiz.subject || "その他";
    items.set(subject, (items.get(subject) || 0) + 1);
    return items;
  }, new Map());
  return Array.from(counts, ([subject, count]) => ({ subject, count }))
    .sort((a, b) => {
      const aIndex = SUBJECT_ORDER.has(a.subject) ? SUBJECT_ORDER.get(a.subject) : SUBJECT_OPTIONS.length;
      const bIndex = SUBJECT_ORDER.has(b.subject) ? SUBJECT_ORDER.get(b.subject) : SUBJECT_OPTIONS.length;
      return aIndex === bIndex ? a.subject.localeCompare(b.subject, "ja") : aIndex - bIndex;
    });
}

function generateClassCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function generateUserId(role) {
  const prefix = role === "teacher" ? "T" : "S";
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const body = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `${prefix}-${body}`;
}

function createProfileForClass({ id, name, role }) {
  return {
    id,
    name: name || "匿名ユーザー",
    bio: "",
    avatarColor: pickAvatarColor(id),
    role,
    createdCount: 0,
    solvedCount: 0,
    challengeCount: 0,
    correctCount: 0,
    answeredBySubject: {},
    correctBySubject: {},
    createdBySubject: {},
    solvedCreatedCount: 0,
  };
}

function getProfileKey(classId, userId) {
  return classId && userId ? `${classId}:${userId}` : "";
}

function getClassroomPeople(classroom) {
  return [
    ...(classroom?.members || []).map((person) =>
      typeof person === "string"
        ? { id: "", name: person, role: "student" }
        : { ...person, id: normalizeUserId(person.id || person.userId), role: "student" }
    ),
    ...(classroom?.teacherMembers || []).map((person) =>
      typeof person === "string"
        ? { id: "", name: person, role: "teacher" }
        : { ...person, id: normalizeUserId(person.id || person.userId), role: "teacher" }
    ),
  ];
}

function findClassPerson(classroom, userId, role) {
  const normalized = normalizeUserId(userId);
  if (!normalized) return null;
  return getClassroomPeople(classroom).find((person) =>
    normalizeUserId(person.id) === normalized && (!role || person.role === role)
  );
}

function getTalkIdentity(entry, classroom) {
  const linkedPerson = entry?.authorId ? findClassPerson(classroom, entry.authorId) : null;
  const linkedName = String(linkedPerson?.name || "").trim();
  const storedName = String(entry?.author || "").trim();
  const name = [linkedName, storedName].find((value) => value && value !== "匿名ユーザー")
    || linkedName
    || storedName
    || "匿名ユーザー";
  const color = linkedPerson?.avatarColor || entry?.authorAvatarColor;
  return {
    name,
    initial: name === "匿名ユーザー" ? "匿" : (Array.from(name)[0] || "匿"),
    bio: normalizeBio(linkedPerson?.bio || entry?.authorBio),
    role: linkedPerson?.role || entry?.authorRole || "",
    avatarColor: AVATAR_COLORS.includes(color) ? color : pickAvatarColor(entry?.authorId || name),
  };
}

function generateUniqueUserId(classroom, role) {
  let userId = generateUserId(role);
  while (findClassPerson(classroom, userId)) userId = generateUserId(role);
  return userId;
}

function upsertClassPerson(classroom, person) {
  const key = person.role === "teacher" ? "teacherMembers" : "members";
  const list = classroom[key] || [];
  const normalizedPerson = { ...person, id: normalizeUserId(person.id) };
  const nextList = list.some((item) => normalizeUserId(item?.id || item?.userId) === normalizedPerson.id)
    ? list.map((item) =>
        normalizeUserId(item?.id || item?.userId) === normalizedPerson.id
          ? { ...item, ...normalizedPerson }
          : item
      )
    : [...list, normalizedPerson];
  return { ...classroom, [key]: nextList };
}

function upsertClassroomInList(classrooms, classroom) {
  return classrooms.some((item) => item.id === classroom.id)
    ? classrooms.map((item) => item.id === classroom.id ? classroom : item)
    : [classroom, ...classrooms];
}

async function resolveClassForJoin(classes, code, userId = "", role = "") {
  const normalizedCode = normalizeClassCode(code);
  const localMatches = classes.filter((item) => normalizeClassCode(item.code) === normalizedCode);
  let remoteMatch = null;

  try {
    remoteMatch = await findClassByCode(normalizedCode);
  } catch (error) {
    console.error("クラス情報をFirebaseから確認できませんでした。", error);
  }

  const candidates = [
    remoteMatch,
    ...localMatches.filter((item) => item.id !== remoteMatch?.id),
  ].filter(Boolean);

  if (userId) {
    return candidates.find((classroom) => findClassPerson(classroom, userId, role))
      || remoteMatch
      || localMatches[0]
      || null;
  }

  return remoteMatch || localMatches[0] || null;
}

const samples = [
  {
    id: "sample-1",
    title: "一次方程式の考え方",
    subject: "数学",
    question: "3x + 5 = 20 のとき、x の値はどれですか？",
    choices: ["3", "4", "5", "6"],
    correctAnswer: "5",
    explanation: "両辺から5を引くと 3x = 15 です。15を3で割ると x = 5 になります。ここから理解が深まります。",
    difficulty: "普通",
    author: "匿名ユーザー",
    solvedCount: 12,
    likes: 8,
  },
  {
    id: "sample-2",
    title: "英単語 context",
    subject: "英語",
    question: "context の意味として近いものはどれですか？",
    choices: ["文脈", "結論", "発音", "例外"],
    correctAnswer: "文脈",
    explanation: "context は文章や会話の前後関係、つまり文脈を表します。例文と一緒に覚えると定着しやすいです。",
    difficulty: "簡単",
    author: "匿名ユーザー",
    solvedCount: 21,
    likes: 14,
  },
  {
    id: "sample-3",
    title: "光合成で作られるもの",
    subject: "理科",
    question: "植物が光合成で主に作るものはどれですか？",
    choices: ["酸素とデンプン", "窒素と水", "塩分と二酸化炭素", "鉄と水素"],
    correctAnswer: "酸素とデンプン",
    explanation: "植物は光を使って二酸化炭素と水からデンプンなどを作り、酸素を出します。挑戦したことが学びです。",
    difficulty: "普通",
    author: "匿名ユーザー",
    solvedCount: 16,
    likes: 11,
  },
  {
    id: "sample-4",
    title: "歴史の時代順",
    subject: "社会",
    question: "次のうち、奈良時代のあとに始まった時代はどれですか？",
    choices: ["平安時代", "弥生時代", "江戸時代", "明治時代"],
    correctAnswer: "平安時代",
    explanation: "奈良時代のあと、794年に都が平安京へ移り、平安時代が始まりました。",
    difficulty: "簡単",
    author: "匿名ユーザー",
    solvedCount: 9,
    likes: 6,
  },
];

const sampleComments = [
  { id: "c1", author: "匿名ユーザー", text: "解説を見ると、どこで考え直せばいいか分かりました。", reactions: { clear: 3, retry: 2, good: 4 } },
  { id: "c2", author: "匿名ユーザー", text: "選択肢の並びがちょうど考えやすかったです。", reactions: { clear: 5, retry: 1, good: 6 } },
];

const defaultUpdateNotes = [
  {
    id: "update-20260730-rejoin",
    version: "β 0.4",
    category: "改善",
    title: "クラスへの再入室を安定させました",
    body: "新しい利用者IDと旧形式の利用者IDの両方に対応しました。全角入力やハイフンの違いも自動で整えて照合します。",
    publishedAt: "2026-07-30T00:00:00+09:00",
    isDefault: true,
  },
  {
    id: "update-20260728-flow",
    version: "β 0.3",
    category: "アップデート",
    title: "入室フローと回答画面を改善しました",
    body: "入室方法を選んだあとに必要な入力欄を表示する形へ変更しました。回答後の正誤表示と、次の問題へ進む流れも整えています。",
    publishedAt: "2026-07-28T00:00:00+09:00",
    isDefault: true,
  },
  {
    id: "update-beta-start",
    version: "β版",
    category: "お知らせ",
    title: "qpath β版を公開しています",
    body: "「間違えて良い」から始まる学びを形にするため、みなさんの挑戦をもとに少しずつ改善していきます。",
    publishedAt: "2026-07-04T00:00:00+09:00",
    isDefault: true,
  },
];

function withDefaultUpdateNotes(remoteNotes) {
  const defaults = new Set(defaultUpdateNotes.map((note) => note.id));
  return [
    ...defaultUpdateNotes,
    ...(remoteNotes || []).filter((note) => !defaults.has(note.id)),
  ];
}

function isSampleQuiz(quiz) {
  return quiz.id.startsWith("sample-");
}

function belongsToClass(quiz, classId) {
  return isSampleQuiz(quiz) || quiz.classId === classId;
}

function belongsToClassComment(comment, classId) {
  return comment.id === "c1" || comment.id === "c2" || comment.classId === classId;
}

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function waitForRemoteSave(promise) {
  return Promise.race([
    promise.catch(console.error),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
}

function Header({ eyebrow, title, body }) {
  return h("header", { className: "page-header" },
    h("div", { className: "brand-mark" }, h(Sparkles, { size: 20 })),
    h("p", null, eyebrow),
    h("h1", null, title),
    body && h("span", null, body)
  );
}

function App() {
  const [screen, setScreen] = useState(() => getScreenFromHash());
  const [navigationIndex, setNavigationIndex] = useState(0);
  const [quizzes, setQuizzes] = useState(() =>
    read(STORAGE.quizzes, samples).filter((quiz) => !isRetiredOyamaQuiz(quiz))
  );
  const [profile, setProfile] = useState(() => read(STORAGE.profile, { name: "匿名ユーザー", createdCount: 0, solvedCount: 0, challengeCount: 0 }));
  const [classProfiles, setClassProfiles] = useState(() => read(STORAGE.classProfiles, {}));
  const [comments, setComments] = useState(() => read(STORAGE.comments, sampleComments));
  const [updateNotes, setUpdateNotes] = useState(() =>
    withDefaultUpdateNotes(read(STORAGE.updateNotes, []))
  );
  const [classes, setClasses] = useState(() => read(STORAGE.classes, []));
  const [membership, setMembership] = useState(() =>
    getScreenFromHash() === "role" ? null : read(STORAGE.membership, null)
  );
  const [activeQuizId, setActiveQuizId] = useState(samples[0].id);
  const [activeEditQuizId, setActiveEditQuizId] = useState("");
  const [message, setMessage] = useState("");
  const [firebaseStatus, setFirebaseStatus] = useState("connecting");
  const [quizSessionIds, setQuizSessionIds] = useState([]);
  const [quizSessionPosition, setQuizSessionPosition] = useState(0);
  const [issuedIdentity, setIssuedIdentity] = useState(null);
  const screenRef = useRef(getScreenFromHash());
  const navigationIndexRef = useRef(0);

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => localStorage.setItem(STORAGE.quizzes, JSON.stringify(quizzes)), [quizzes]);
  useEffect(() => localStorage.setItem(STORAGE.profile, JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem(STORAGE.classProfiles, JSON.stringify(classProfiles)), [classProfiles]);
  useEffect(() => localStorage.setItem(STORAGE.comments, JSON.stringify(comments)), [comments]);
  useEffect(() => localStorage.setItem(STORAGE.updateNotes, JSON.stringify(updateNotes)), [updateNotes]);
  useEffect(() => localStorage.setItem(STORAGE.classes, JSON.stringify(classes)), [classes]);
  useEffect(() => {
    if (membership) localStorage.setItem(STORAGE.membership, JSON.stringify(membership));
    else localStorage.removeItem(STORAGE.membership);
  }, [membership]);
  useEffect(() => {
    if (!membership?.classId) return;
    setQuizzes((current) => {
      let changed = false;
      const migrated = current.map((quiz) => {
        if (isSampleQuiz(quiz) || quiz.classId) return quiz;
        changed = true;
        return { ...quiz, classId: membership.classId };
      });
      return changed ? migrated : current;
    });
  }, [membership?.classId]);
  useEffect(() => {
    if (!membership?.classId || membership.userId) return;
    const role = membership.role === "teacher" ? "teacher" : "student";
    const generatedId = generateUserId(role);
    const currentName = profile.name || "匿名ユーザー";
    setMembership((current) => current ? { ...current, userId: generatedId } : current);
    setClassProfiles((current) => ({
      ...current,
      [getProfileKey(membership.classId, generatedId)]: current[getProfileKey(membership.classId, generatedId)] || createProfileForClass({
        id: generatedId,
        name: currentName,
        role,
      }),
    }));
    setClasses((current) => current.map((classroom) => {
      if (classroom.id !== membership.classId) return classroom;
      return upsertClassPerson(classroom, {
        id: generatedId,
        name: currentName,
        role,
        joinedAt: new Date().toISOString(),
      });
    }));
  }, [membership?.classId, membership?.role, membership?.userId, profile.name]);
  useEffect(() => {
    let cancelled = false;
    const unsubscribes = [];
    const start = async () => {
      try {
        await ensureFirebaseReady();
        if (cancelled) return;
        if (!localStorage.getItem("qpath.firebaseMigrated")) {
          await migrateLocalData({
            classes,
            quizzes: quizzes.filter((quiz) => !isRetiredOyamaQuiz(quiz)),
            comments,
          });
          localStorage.setItem("qpath.firebaseMigrated", "true");
        }
        if (cancelled) return;
        unsubscribes.push(
          subscribeClasses(setClasses, () => setFirebaseStatus("error")),
          subscribeQuizzes(
            (remoteQuizzes) => {
              remoteQuizzes
                .filter((item) => !isSampleQuiz(item) && isRetiredOyamaQuiz(item))
                .forEach((item) => removeQuiz(item.id).catch(console.error));
              setQuizzes([
                ...samples,
                ...remoteQuizzes.filter((item) => !isSampleQuiz(item) && !isRetiredOyamaQuiz(item)),
              ]);
            },
            () => setFirebaseStatus("error")
          ),
          subscribeComments(
            (remoteComments) => setComments([...sampleComments, ...remoteComments.filter((item) => item.id !== "c1" && item.id !== "c2")]),
            () => setFirebaseStatus("error")
          ),
          subscribeUpdateNotes(
            (remoteNotes) => setUpdateNotes(withDefaultUpdateNotes(remoteNotes)),
            () => setFirebaseStatus("error")
          )
        );
        setFirebaseStatus("connected");
      } catch (error) {
        console.error("Firebase connection failed", error);
        setFirebaseStatus("error");
      }
    };
    start();
    return () => {
      cancelled = true;
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);
  useEffect(() => {
    const baseUrl = `${window.location.pathname}${window.location.search}`;
    if (membership) {
      const historyState = window.history.state;
      if (historyState?.qpath === "app" && historyState.screen) {
        const restoredIndex = Number.isInteger(historyState.index) ? historyState.index : 0;
        navigationIndexRef.current = restoredIndex;
        setNavigationIndex(restoredIndex);
        setScreen(historyState.screen);
      } else {
        const initialScreen = getScreenFromHash();
        screenRef.current = initialScreen;
        navigationIndexRef.current = 0;
        setNavigationIndex(0);
        setScreen(initialScreen);
        window.history.replaceState(
          { qpath: "app", screen: initialScreen, index: 0 },
          "",
          `${baseUrl}#${initialScreen}`
        );
      }
    } else {
      window.history.replaceState({ qpath: "role" }, "", `${baseUrl}#role`);
    }
  }, [membership]);
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.qpath === "app" && event.state.screen) {
        const restoredIndex = Number.isInteger(event.state.index) ? event.state.index : 0;
        navigationIndexRef.current = restoredIndex;
        setNavigationIndex(restoredIndex);
        setScreen(event.state.screen);
        return;
      }
      if (membership) {
        const baseUrl = `${window.location.pathname}${window.location.search}`;
        navigationIndexRef.current = 0;
        setNavigationIndex(0);
        setScreen("home");
        window.history.replaceState(
          { qpath: "app", screen: "home", index: 0 },
          "",
          `${baseUrl}#home`
        );
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [membership]);
  useEffect(() => {
    const handleHashChange = () => {
      if (!membership) return;
      const nextScreen = getScreenFromHash();
      if (nextScreen === "role") {
        setMembership(null);
        setScreen("role");
        screenRef.current = "role";
        navigationIndexRef.current = 0;
        setNavigationIndex(0);
        return;
      }
      if (nextScreen === screenRef.current) return;
      const baseUrl = `${window.location.pathname}${window.location.search}`;
      screenRef.current = nextScreen;
      setScreen(nextScreen);
      window.history.replaceState(
        { qpath: "app", screen: nextScreen, index: navigationIndexRef.current },
        "",
        `${baseUrl}#${nextScreen}`
      );
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [membership]);

  const navigateTo = (nextScreen, { replace = false } = {}) => {
    if (!nextScreen) return;
    setScreen(nextScreen);
    screenRef.current = nextScreen;
    if (!membership) return;

    const baseUrl = `${window.location.pathname}${window.location.search}`;
    if (!replace && nextScreen === window.history.state?.screen) return;
    const nextIndex = replace ? navigationIndexRef.current : navigationIndexRef.current + 1;
    const state = { qpath: "app", screen: nextScreen, index: nextIndex };
    if (replace) {
      window.history.replaceState(state, "", `${baseUrl}#${nextScreen}`);
    } else {
      window.history.pushState(state, "", `${baseUrl}#${nextScreen}`);
    }
    navigationIndexRef.current = nextIndex;
    setNavigationIndex(nextIndex);
  };

  const goBackSafely = () => {
    const historyState = window.history.state;
    if (historyState?.qpath === "app" && navigationIndexRef.current > 0) {
      window.history.back();
      return;
    }
    navigateTo("home", { replace: true });
  };

  const enterAppScreen = (nextScreen) => {
    const baseUrl = `${window.location.pathname}${window.location.search}`;
    setScreen(nextScreen);
    screenRef.current = nextScreen;
    navigationIndexRef.current = 0;
    setNavigationIndex(0);
    window.history.replaceState(
      { qpath: "app", screen: nextScreen, index: 0 },
      "",
      `${baseUrl}#${nextScreen}`
    );
  };

  const classQuizzes = useMemo(
    () => membership?.classId ? quizzes.filter((quiz) => belongsToClass(quiz, membership.classId)) : [],
    [quizzes, membership?.classId]
  );
  const classComments = useMemo(
    () => membership?.classId ? comments.filter((comment) => belongsToClassComment(comment, membership.classId)) : [],
    [comments, membership?.classId]
  );
  const activeQuiz = useMemo(
    () => classQuizzes.find((quiz) => quiz.id === activeQuizId) || null,
    [activeQuizId, classQuizzes]
  );
  const activeEditQuiz = useMemo(
    () => classQuizzes.find((quiz) => quiz.id === activeEditQuizId) || null,
    [activeEditQuizId, classQuizzes]
  );
  const quizProgress = quizSessionIds[quizSessionPosition] === activeQuizId
    ? {
        current: quizSessionPosition + 1,
        total: quizSessionIds.length,
        hasNext: quizSessionPosition < quizSessionIds.length - 1,
      }
    : null;
  const activeClass = useMemo(
    () => classes.find((classroom) => classroom.id === membership?.classId) || null,
    [classes, membership]
  );
  const activeProfileKey = getProfileKey(membership?.classId, membership?.userId);
  const activeClassProfile = activeProfileKey ? classProfiles[activeProfileKey] : null;
  const hasDeveloperAccess = Boolean(
    membership?.isDeveloper
    && isDeveloperUserId(membership.userId)
    && localStorage.getItem(STORAGE.developerAccess) === DEVELOPER_KEY_HASH
  );

  useEffect(() => {
    if (!membership?.classId || !membership.userId || !activeClass || membership.isDeveloper) return;
    const role = membership.role === "teacher" ? "teacher" : "student";
    const existing = findClassPerson(activeClass, membership.userId, role);
    const person = {
      ...existing,
      id: membership.userId,
      name: activeClassProfile?.name || profile.name || "匿名ユーザー",
      bio: normalizeBio(activeClassProfile?.bio),
      avatarColor: activeClassProfile?.avatarColor || pickAvatarColor(membership.userId),
      role,
      joinedAt: existing?.joinedAt || new Date().toISOString(),
    };
    if (
      existing
      && existing.name === person.name
      && normalizeBio(existing.bio) === person.bio
      && existing.avatarColor === person.avatarColor
    ) return;
    const updatedClassroom = upsertClassPerson(activeClass, person);
    setClasses((current) => current.map((classroom) => classroom.id === activeClass.id ? updatedClassroom : classroom));
    saveClass(updatedClassroom).catch(console.error);
    setClassProfiles((current) => ({
      ...current,
      [getProfileKey(activeClass.id, membership.userId)]: current[getProfileKey(activeClass.id, membership.userId)] || createProfileForClass({
        id: membership.userId,
        name: person.name,
        role,
      }),
    }));
  }, [membership?.classId, membership?.isDeveloper, membership?.role, membership?.userId, activeClass?.id, activeClassProfile?.name, activeClassProfile?.bio, activeClassProfile?.avatarColor, profile.name]);

  const updateClassProfile = (updater, targetKey = activeProfileKey) => {
    if (!targetKey) return;
    setClassProfiles((current) => {
      const fallbackUserId = targetKey.split(":")[1] || membership?.userId;
      const base = current[targetKey] || createProfileForClass({
        id: fallbackUserId,
        name: profile.name,
        role: membership?.role,
      });
      return { ...current, [targetKey]: updater(base) };
    });
  };
  const openQuiz = (id, quizPool = classQuizzes) => {
    const sessionQuizzes = quizPool.length ? quizPool : classQuizzes;
    const startIndex = sessionQuizzes.findIndex((quiz) => quiz.id === id);
    if (startIndex < 0) return;
    const session = [
      ...sessionQuizzes.slice(startIndex),
      ...sessionQuizzes.slice(0, startIndex),
    ].map((quiz) => quiz.id);
    setQuizSessionIds(session);
    setQuizSessionPosition(0);
    setActiveQuizId(id);
    navigateTo("answer");
  };
  const goToNextQuiz = (wasCorrect) => {
    const nextSessionIds = wasCorrect ? quizSessionIds : [...quizSessionIds, activeQuizId];
    const nextPosition = quizSessionPosition + 1;
    const nextId = nextSessionIds[nextPosition];
    if (nextId) {
      setQuizSessionIds(nextSessionIds);
      setQuizSessionPosition(nextPosition);
      setActiveQuizId(nextId);
      navigateTo("answer", { replace: true });
      return;
    }
    setQuizSessionIds([]);
    setQuizSessionPosition(0);
    navigateTo("home");
  };
  const recordAnswer = (quiz, isCorrect) => {
    setQuizzes((list) => list.map((item) => item.id === quiz.id ? { ...item, solvedCount: (item.solvedCount || 0) + 1 } : item));
    setProfile((current) => ({
      ...current,
      solvedCount: (current.solvedCount || 0) + 1,
      challengeCount: (current.challengeCount || 0) + 1,
    }));
    updateClassProfile((current) => {
      const subject = quiz.subject || "その他";
      const answeredBySubject = { ...(current.answeredBySubject || {}) };
      const correctBySubject = { ...(current.correctBySubject || {}) };
      answeredBySubject[subject] = (answeredBySubject[subject] || 0) + 1;
      if (isCorrect) correctBySubject[subject] = (correctBySubject[subject] || 0) + 1;
      return {
        ...current,
        solvedCount: (current.solvedCount || 0) + 1,
        challengeCount: (current.challengeCount || 0) + 1,
        correctCount: (current.correctCount || 0) + (isCorrect ? 1 : 0),
        answeredBySubject,
        correctBySubject,
      };
    });
    if (quiz.classId && quiz.authorId) {
      updateClassProfile((current) => ({
        ...current,
        solvedCreatedCount: (current.solvedCreatedCount || 0) + 1,
      }), getProfileKey(quiz.classId, quiz.authorId));
    }
    if (!String(quiz.id).startsWith("sample-")) increaseQuizSolvedCount(quiz.id).catch(console.error);
  };
  const createQuiz = async (form) => {
    const quiz = {
      id: `quiz-${Date.now()}`,
      title: form.title.trim(),
      subject: form.subject.trim(),
      question: form.question.trim(),
      choices: form.choices.map((choice) => choice.trim()),
      correctAnswer: form.correctAnswer.trim(),
      explanation: form.explanation.trim(),
      difficulty: form.difficulty,
      author: activeClassProfile?.name || profile.name,
      authorId: membership.userId,
      classId: membership.classId,
      solvedCount: 0,
      likes: 0,
    };
    setQuizzes((list) => [quiz, ...list]);
    await waitForRemoteSave(saveQuiz(quiz));
    setProfile((current) => ({ ...current, createdCount: current.createdCount + 1 }));
    updateClassProfile((current) => {
      const subject = quiz.subject || "その他";
      const createdBySubject = { ...(current.createdBySubject || {}) };
      createdBySubject[subject] = (createdBySubject[subject] || 0) + 1;
      return {
        ...current,
        createdCount: (current.createdCount || 0) + 1,
        createdBySubject,
      };
    });
    setMessage("作問も大切な学びです！");
    setActiveQuizId(quiz.id);
    navigateTo("quizzes");
  };

  const editOwnQuiz = (quizId) => {
    const quiz = classQuizzes.find((item) => item.id === quizId);
    if (!quiz || quiz.authorId !== membership.userId) return;
    setActiveEditQuizId(quizId);
    navigateTo("edit");
  };

  const updateQuiz = async (form) => {
    const currentQuiz = classQuizzes.find((item) => item.id === activeEditQuizId);
    if (!currentQuiz || currentQuiz.authorId !== membership.userId) return false;
    const updatedQuiz = {
      ...currentQuiz,
      title: form.title.trim(),
      subject: form.subject.trim(),
      question: form.question.trim(),
      choices: form.choices.map((choice) => choice.trim()),
      correctAnswer: form.correctAnswer.trim(),
      explanation: form.explanation.trim(),
      difficulty: form.difficulty,
      author: activeClassProfile?.name || profile.name,
      updatedAt: new Date().toISOString(),
    };
    setQuizzes((list) => list.map((quiz) => quiz.id === updatedQuiz.id ? updatedQuiz : quiz));
    await waitForRemoteSave(saveQuiz(updatedQuiz));
    setMessage("クイズを更新しました。作問も大切な学びです。");
    setActiveEditQuizId("");
    navigateTo("profile");
    return true;
  };

  const deleteQuizAsDeveloper = async (quizId) => {
    if (!hasDeveloperAccess) return false;
    const quiz = classQuizzes.find((item) => item.id === quizId);
    if (!quiz || isSampleQuiz(quiz)) return false;
    setQuizzes((current) => current.filter((item) => item.id !== quizId));
    try {
      await removeQuiz(quizId);
      setMessage("クイズを削除しました。");
      return true;
    } catch (error) {
      console.error("クイズを削除できませんでした。", error);
      setQuizzes((current) => current.some((item) => item.id === quiz.id) ? current : [quiz, ...current]);
      setMessage("クイズを削除できませんでした。通信状態を確認してください。");
      return false;
    }
  };

  const createClass = async ({ name, code, nickname, password }) => {
    const teacherId = generateUserId("teacher");
    const classroom = {
      id: `class-${Date.now()}`,
      name: name.trim() || "新しいクラス",
      code,
      password,
      teacher: nickname,
      teachers: [nickname],
      teacherMembers: [{ id: teacherId, name: nickname, joinedAt: new Date().toISOString() }],
      members: [],
      createdAt: new Date().toISOString(),
    };
    setProfile((current) => ({ ...current, name: nickname }));
    setClassProfiles((current) => ({
      ...current,
      [getProfileKey(classroom.id, teacherId)]: createProfileForClass({ id: teacherId, name: nickname, role: "teacher" }),
    }));
    setClasses((current) => [classroom, ...current]);
    await waitForRemoteSave(saveClass(classroom));
    setMembership({ role: "teacher", classId: classroom.id, userId: teacherId });
    setIssuedIdentity({ userId: teacherId, className: classroom.name });
    enterAppScreen("dashboard");
  };

  const joinClass = async ({ code, nickname, userId }) => {
    const normalizedUserId = normalizeUserId(userId);
    const classroom = await resolveClassForJoin(classes, code, normalizedUserId, "student");
    if (!classroom) return false;
    const existing = normalizedUserId ? findClassPerson(classroom, normalizedUserId, "student") : null;
    if (normalizedUserId && !existing) return false;
    const memberId = existing?.id || generateUniqueUserId(classroom, "student");
    const memberName = existing?.name || nickname;
    setProfile((current) => ({ ...current, name: memberName }));
    const updatedClassroom = upsertClassPerson(classroom, {
      id: memberId,
      name: memberName,
      role: "student",
      joinedAt: existing?.joinedAt || new Date().toISOString(),
    });
    setClassProfiles((current) => ({
      ...current,
      [getProfileKey(classroom.id, memberId)]: current[getProfileKey(classroom.id, memberId)] || createProfileForClass({ id: memberId, name: memberName, role: "student" }),
    }));
    setClasses((current) => upsertClassroomInList(current, updatedClassroom));
    await waitForRemoteSave(saveClass(updatedClassroom));
    setMembership({ role: "student", classId: classroom.id, userId: memberId });
    if (!existing) setIssuedIdentity({ userId: memberId, className: classroom.name });
    enterAppScreen("home");
    return true;
  };

  const joinClassAsTeacher = async ({ code, nickname, userId, password }) => {
    const normalizedUserId = normalizeUserId(userId);
    const developerEntry = isDeveloperUserId(normalizedUserId);
    const classroom = await resolveClassForJoin(
      classes,
      code,
      developerEntry ? "" : normalizedUserId,
      developerEntry ? "" : "teacher"
    );
    if (!classroom) return false;

    if (developerEntry) {
      try {
        const hashedKey = await hashDeveloperKey(password);
        if (hashedKey !== DEVELOPER_KEY_HASH) return false;
      } catch (error) {
        console.error("開発者キーを確認できませんでした。", error);
        return false;
      }
      const developerName = nickname || "qpath 開発者";
      localStorage.setItem(STORAGE.developerAccess, DEVELOPER_KEY_HASH);
      setProfile((current) => ({ ...current, name: developerName }));
      setClassProfiles((current) => ({
        ...current,
        [getProfileKey(classroom.id, DEVELOPER_USER_ID)]: current[getProfileKey(classroom.id, DEVELOPER_USER_ID)] || createProfileForClass({
          id: DEVELOPER_USER_ID,
          name: developerName,
          role: "teacher",
        }),
      }));
      setClasses((current) => upsertClassroomInList(current, classroom));
      setMembership({
        role: "teacher",
        classId: classroom.id,
        userId: DEVELOPER_USER_ID,
        isDeveloper: true,
      });
      enterAppScreen("dashboard");
      return true;
    }

    if ((classroom.password || "") !== password) return false;
    const existing = normalizedUserId ? findClassPerson(classroom, normalizedUserId, "teacher") : null;
    if (normalizedUserId && !existing) return false;
    const teacherId = existing?.id || generateUniqueUserId(classroom, "teacher");
    const teacherName = existing?.name || nickname;
    setProfile((current) => ({ ...current, name: teacherName }));
    const teacherNames = classroom.teachers || [classroom.teacher];
    const updatedClassroom = upsertClassPerson({
      ...classroom,
      teachers: teacherNames.includes(teacherName) ? teacherNames : [...teacherNames, teacherName],
    }, {
      id: teacherId,
      name: teacherName,
      role: "teacher",
      joinedAt: existing?.joinedAt || new Date().toISOString(),
    });
    setClassProfiles((current) => ({
      ...current,
      [getProfileKey(classroom.id, teacherId)]: current[getProfileKey(classroom.id, teacherId)] || createProfileForClass({ id: teacherId, name: teacherName, role: "teacher" }),
    }));
    setClasses((current) => upsertClassroomInList(current, updatedClassroom));
    await waitForRemoteSave(saveClass(updatedClassroom));
    setMembership({ role: "teacher", classId: classroom.id, userId: teacherId });
    if (!existing) setIssuedIdentity({ userId: teacherId, className: classroom.name });
    enterAppScreen("dashboard");
    return true;
  };

  const updateCurrentProfile = (changes) => {
    const nextName = changes.name?.trim();
    const resolvedName = nextName || activeClassProfile?.name || profile.name || "匿名ユーザー";
    const resolvedBio = Object.prototype.hasOwnProperty.call(changes, "bio")
      ? normalizeBio(changes.bio)
      : normalizeBio(activeClassProfile?.bio);
    const requestedColor = changes.avatarColor || activeClassProfile?.avatarColor;
    const resolvedAvatarColor = AVATAR_COLORS.includes(requestedColor)
      ? requestedColor
      : pickAvatarColor(membership?.userId);
    setProfile((current) => ({
      ...current,
      ...changes,
      name: nextName || current.name,
      bio: resolvedBio,
      avatarColor: resolvedAvatarColor,
    }));
    updateClassProfile((current) => ({
      ...current,
      ...changes,
      name: nextName || current.name,
      bio: resolvedBio,
      avatarColor: resolvedAvatarColor,
    }));

    if (!activeClass || !membership?.userId || membership.isDeveloper) return;
    const role = membership.role === "teacher" ? "teacher" : "student";
    const existing = findClassPerson(activeClass, membership.userId, role);
    const updatedClassroom = upsertClassPerson(activeClass, {
      ...existing,
      id: membership.userId,
      name: resolvedName,
      bio: resolvedBio,
      avatarColor: resolvedAvatarColor,
      role,
      joinedAt: existing?.joinedAt || new Date().toISOString(),
    });
    setClasses((current) => current.map((classroom) =>
      classroom.id === activeClass.id ? updatedClassroom : classroom
    ));
    saveClass(updatedClassroom).catch(console.error);
  };

  const publishUpdateNote = async (draft) => {
    const existing = updateNotes.find((note) => note.id === draft.id);
    const now = new Date().toISOString();
    const note = {
      id: existing?.id || `update-${Date.now()}`,
      version: draft.version.trim(),
      category: draft.category,
      title: draft.title.trim(),
      body: draft.body.trim(),
      author: "qpath 開発者",
      publishedAt: existing?.publishedAt || now,
      updatedAt: now,
    };
    setUpdateNotes((current) => [
      note,
      ...current.filter((item) => item.id !== note.id),
    ]);
    await waitForRemoteSave(saveUpdateNote(note));
    return note;
  };

  const deletePublishedUpdateNote = (noteId) => {
    const note = updateNotes.find((item) => item.id === noteId);
    if (!note || note.isDefault) return;
    setUpdateNotes((current) => current.filter((item) => item.id !== noteId));
    removeUpdateNote(noteId).catch(console.error);
  };

  const resetRole = () => {
    setMembership(null);
    setScreen("role");
    screenRef.current = "role";
    navigationIndexRef.current = 0;
    setNavigationIndex(0);
  };

  useEffect(() => {
    if (membership && screen === "answer" && !activeQuiz) {
      navigateTo("home", { replace: true });
    }
  }, [screen, activeQuiz, membership]);

  if (!membership) {
    return h("div", { className: "app-shell onboarding-shell" },
      h("main", { className: "phone-frame" },
        h(RoleSetup, { createClass, joinClass, joinClassAsTeacher })
      )
    );
  }

  return h(React.Fragment, null,
    h("div", { className: "app-shell" },
      h("main", { className: "phone-frame" },
        screen !== "home" && h("div", { className: "page-back-row" },
          h("button", {
            className: "page-back-button",
            type: "button",
            onClick: goBackSafely,
            "aria-label": "ひとつ前の画面に戻る",
            title: "戻る",
          }, h(ArrowLeft, { size: 21 }), h("span", null, "戻る"))
        ),
        firebaseStatus === "error" && h("div", { className: "sync-notice" }, "オンライン同期を確認できません。Firebaseの設定を確認してください。"),
        (screen === "home" || (screen === "answer" && !activeQuiz)) && h(HomeScreen, { setScreen: navigateTo, membership, activeClass }),
        screen === "quizzes" && h(QuizList, {
          quizzes: classQuizzes,
          openQuiz,
          message,
          clearMessage: () => setMessage(""),
          developerMode: hasDeveloperAccess,
          deleteQuiz: deleteQuizAsDeveloper,
        }),
        screen === "answer" && activeQuiz && h(AnswerScreen, {
          quiz: activeQuiz,
          recordAnswer,
          quizProgress,
          goToNextQuiz,
        }),
        screen === "create" && h(CreateScreen, { createQuiz }),
        screen === "edit" && activeEditQuiz && h(CreateScreen, {
          createQuiz: updateQuiz,
          editingQuiz: activeEditQuiz,
        }),
        screen === "study" && h(StudyScreen, {
          comments: classComments,
          activeClass,
          addComment: (text) => {
            const comment = {
              id: `comment-${Date.now()}`,
              author: activeClassProfile?.name || profile.name,
              authorId: membership.userId,
              authorBio: normalizeBio(activeClassProfile?.bio),
              authorRole: membership.role,
              authorAvatarColor: activeClassProfile?.avatarColor || pickAvatarColor(membership.userId),
              text,
              classId: membership.classId,
              reactions: { "😊": 0, "🥰": 0, "🫡": 0, "😯": 0 },
              replies: [],
            };
            setComments((current) => [comment, ...current]);
            saveComment(comment).catch(console.error);
          },
          addReply: (id, text) => {
            setComments((current) => current.map((comment) => {
              if (comment.id !== id) return comment;
              const updated = {
                ...comment,
                replies: [
                  ...(comment.replies || []),
                  {
                    id: `reply-${Date.now()}`,
                    author: activeClassProfile?.name || profile.name,
                    authorId: membership.userId,
                    authorBio: normalizeBio(activeClassProfile?.bio),
                    authorRole: membership.role,
                    authorAvatarColor: activeClassProfile?.avatarColor || pickAvatarColor(membership.userId),
                    text,
                    createdAt: new Date().toISOString(),
                  },
                ],
              };
              if (id !== "c1" && id !== "c2") saveComment(updated).catch(console.error);
              return updated;
            }));
          },
          reactToComment: (id, key) => {
            setComments((current) => current.map((comment) => {
              if (comment.id !== id) return comment;
              const reactions = { "😊": 0, "🥰": 0, "🫡": 0, "😯": 0, ...(comment.reactions || {}) };
              const updated = {
                ...comment,
                reactions: { ...reactions, [key]: (reactions[key] || 0) + 1 },
              };
              if (id !== "c1" && id !== "c2") saveComment(updated).catch(console.error);
              return updated;
            }));
          },
        }),
        screen === "profile" && h(ProfileScreen, {
          profile,
          classProfile: activeClassProfile,
          membership,
          activeClass,
          classProfiles,
          resetRole,
          setScreen: navigateTo,
          ownQuizzes: classQuizzes.filter((quiz) => quiz.authorId === membership.userId),
          editOwnQuiz,
          updateProfile: updateCurrentProfile,
          developerMode: hasDeveloperAccess,
        }),
        screen === "updates" && h(DeveloperNotesScreen, {
          notes: updateNotes,
          publishNote: publishUpdateNote,
          deleteNote: deletePublishedUpdateNote,
        }),
        screen === "dashboard" && membership.role === "teacher" && h(TeacherDashboard, {
          activeClass,
          quizzes: classQuizzes,
          classProfiles,
          setScreen: navigateTo,
        })
      )
    ),
    issuedIdentity && h(IssuedUserIdNotice, {
      identity: issuedIdentity,
      onClose: () => setIssuedIdentity(null),
    }),
    h(BottomNav, { current: screen, setScreen: navigateTo })
  );
}

function RoleSetup({ createClass, joinClass, joinClassAsTeacher }) {
  const [role, setRole] = useState("");
  const [step, setStep] = useState("role");
  const [nickname, setNickname] = useState("");
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [userId, setUserId] = useState("");
  const [classPassword, setClassPassword] = useState("");
  const [returning, setReturning] = useState(null);
  const [teacherAction, setTeacherAction] = useState("");
  const [error, setError] = useState("");
  const developerEntry = role === "teacher" && returning === true && isDeveloperUserId(userId);

  const chooseRole = (nextRole) => {
    setRole(nextRole);
    setStep("nickname");
    setError("");
    if (nextRole === "teacher") setClassCode(generateClassCode());
  };

  const submitJoin = async (event) => {
    event.preventDefault();
    if (returning === null) {
      setError("「はじめて入る」か「入ったことがある」を選んでください。");
      return;
    }
    if (returning && !normalizeUserId(userId)) {
      setError(`利用者IDを確認してください。例：${role === "teacher" ? "T-ABCDE" : "S-ABCDE"}`);
      return;
    }
    const joined = role === "teacher"
      ? await joinClassAsTeacher({ code: joinCode, nickname: nickname.trim(), userId, password: classPassword })
      : await joinClass({ code: joinCode, nickname: nickname.trim(), userId });
    if (!joined) {
      const details = role === "teacher"
        ? developerEntry
          ? "クラスコード、開発者ID、開発者キー"
          : "クラスコード、利用者ID、先生用パスワード"
        : returning ? "クラスコードと利用者ID" : "クラスコード";
      setError(`${details}をもう一度確認してください。`);
    }
  };

  return h("section", { className: "screen role-screen" },
    h(Header, {
      eyebrow: "Welcome to qpath",
      title: "どちらの立場で学びますか？",
      body: "役割はあとからプロフィールで選び直せます。",
    }),
    step === "role" && h("div", { className: "role-grid" },
      h("button", { className: "role-card", onClick: () => chooseRole("teacher") },
        h("div", { className: "role-icon teacher" }, h(School, { size: 30 })),
        h("strong", null, "教員としてはじめる"),
        h("span", null, "クラスを作成して、参加コードを生徒に共有します。"),
        h(ChevronRight, { size: 20 })
      ),
      h("button", { className: "role-card", onClick: () => chooseRole("student") },
        h("div", { className: "role-icon student" }, h(GraduationCap, { size: 30 })),
        h("strong", null, "生徒としてはじめる"),
        h("span", null, "先生から受け取ったコードでクラスに参加します。"),
        h(ChevronRight, { size: 20 })
      )
    ),
    step === "nickname" && h("form", {
      className: "role-form",
      onSubmit: (event) => {
        event.preventDefault();
        if (nickname.trim()) {
          setReturning(null);
          setStep(role === "teacher" ? "teacher-choice" : "class");
        }
      },
    },
      h("button", {
        type: "button",
        className: "text-button",
        onClick: () => {
          setRole("");
          setStep("role");
        },
      }, "役割選択に戻る"),
      h("div", { className: "role-heading" },
        h("div", { className: `role-icon ${role}` },
          h(role === "teacher" ? School : GraduationCap, { size: 26 })
        ),
        h("div", null,
          h("strong", null, "ニックネームを設定"),
          h("span", null, "クラス内で表示される名前です")
        )
      ),
      field("ニックネーム", h("input", {
        value: nickname,
        onChange: (event) => setNickname(event.target.value.slice(0, 20)),
        placeholder: role === "teacher" ? "例：さとう先生" : "例：あおい",
        maxLength: 20,
        autoFocus: true,
        required: true,
      })),
      h("p", { className: "nickname-note" }, "本名でなくても大丈夫です。あとから選び直せます。"),
      h("button", { className: "primary-button", type: "submit", disabled: !nickname.trim() },
        "次へ",
        h(ChevronRight, { size: 18 })
      )
    ),
    step === "teacher-choice" && role === "teacher" && h("div", { className: "role-form" },
      h("button", { type: "button", className: "text-button", onClick: () => setStep("nickname") }, "ニックネーム設定に戻る"),
      h("div", { className: "role-heading" },
        h("div", { className: "role-icon teacher" }, h(School, { size: 26 })),
        h("div", null,
          h("strong", null, "クラスへの入り方を選択"),
          h("span", null, "新しく作るか、既存クラスへ参加できます")
        )
      ),
      h("div", { className: "teacher-entry-grid" },
        h("button", {
          type: "button",
          className: "entry-option",
          onClick: () => {
            setTeacherAction("create");
            setReturning(false);
            setStep("class");
          },
        },
          h(Plus, { size: 23 }),
          h("strong", null, "新しいクラスを作る"),
          h("span", null, "参加コードを発行します")
        ),
        h("button", {
          type: "button",
          className: "entry-option",
          onClick: () => {
            setTeacherAction("join");
            setReturning(null);
            setUserId("");
            setClassPassword("");
            setStep("class");
          },
        },
          h(KeyRound, { size: 23 }),
          h("strong", null, "コードでクラスに入る"),
          h("span", null, "共同教員として参加します")
        )
      )
    ),
    step === "class" && role === "teacher" && teacherAction === "create" && h("form", {
      className: "role-form",
      onSubmit: (event) => {
        event.preventDefault();
        createClass({ name: className, code: classCode, nickname: nickname.trim(), password: classPassword });
      },
    },
      h("button", { type: "button", className: "text-button", onClick: () => setStep("teacher-choice") }, "入り方の選択に戻る"),
      h("div", { className: "role-heading" },
        h("div", { className: "role-icon teacher" }, h(School, { size: 26 })),
        h("div", null, h("strong", null, "教員用クラスを作成"), h("span", null, "クラスコードを発行しました"))
      ),
      field("クラス名", h("input", {
        value: className,
        onChange: (event) => setClassName(event.target.value),
        placeholder: "例：2年3組 数学",
        required: true,
      })),
      field("先生用パスワード", h("input", {
        type: "password",
        value: classPassword,
        onChange: (event) => setClassPassword(event.target.value.slice(0, 32)),
        placeholder: "共同教員が入るときに使います",
        required: true,
      })),
      h("div", { className: "code-panel" },
        h("span", null, "クラスコード"),
        h("strong", null, classCode),
        h("small", null, "作成後、このコードを生徒に共有してください")
      ),
      h("button", { className: "primary-button", type: "submit", disabled: !className.trim() || !classPassword }, h(Plus, { size: 18 }), "クラスを作成")
    ),
    step === "class" && (role === "student" || teacherAction === "join") && h("form", { className: "role-form", onSubmit: submitJoin },
      h("button", {
        type: "button",
        className: "text-button",
        onClick: () => setStep(role === "teacher" ? "teacher-choice" : "nickname"),
      }, role === "teacher" ? "入り方の選択に戻る" : "ニックネーム設定に戻る"),
      h("div", { className: "role-heading" },
        h("div", { className: `role-icon ${role}` }, h(KeyRound, { size: 26 })),
        h("div", null,
          h("strong", null, role === "teacher" ? "教員としてクラスに参加" : "クラスに参加"),
          h("span", null, "参加方法を選び、共有されたコードを入力します")
        )
      ),
      h("div", { className: "join-mode-selector", "aria-label": "クラスへの参加方法" },
        h("button", {
          type: "button",
          className: `join-mode-button ${returning === false ? "selected" : ""}`,
          "aria-pressed": returning === false,
          onClick: () => {
            setReturning(false);
            setUserId("");
            setError("");
          },
        },
          h(Plus, { size: 20 }),
          h("span", null, "はじめて入る"),
          h("small", null, "利用者IDを新しく発行")
        ),
        h("button", {
          type: "button",
          className: `join-mode-button ${returning === true ? "selected" : ""}`,
          "aria-pressed": returning === true,
          onClick: () => {
            setReturning(true);
            setError("");
          },
        },
          h(KeyRound, { size: 20 }),
          h("span", null, "入ったことがある"),
          h("small", null, "以前の利用者IDで入室")
        )
      ),
      returning === null && h("p", { className: "join-mode-help" }, "まず、どちらかを選んでください。"),
      returning !== null && h(React.Fragment, null,
        field("クラスコード", h("input", {
          className: "code-input",
          value: joinCode,
          onChange: (event) => {
            setJoinCode(normalizeClassCode(event.target.value));
            setError("");
          },
          placeholder: "ABC234",
          maxLength: 6,
          autoCapitalize: "characters",
          required: true,
        })),
        returning && field("利用者ID", h("input", {
          className: "code-input",
          value: userId,
          onChange: (event) => {
            setUserId(normalizeUserId(event.target.value));
            setError("");
          },
          placeholder: role === "teacher" ? "T-ABCDE" : "S-ABCDE",
          maxLength: 40,
          autoCapitalize: "characters",
          required: true,
        })),
        role === "teacher" && field(developerEntry ? "開発者キー" : "クラスのパスワード", h("input", {
          type: "password",
          value: classPassword,
          onChange: (event) => {
            setClassPassword(event.target.value.slice(0, 32));
            setError("");
          },
          placeholder: developerEntry ? "開発者キー" : "先生用パスワード",
          required: true,
        })),
        error && h("p", { className: "form-error" }, error),
        h("button", {
          className: "primary-button",
          type: "submit",
          disabled:
            joinCode.length !== 6 ||
            (returning && !normalizeUserId(userId)) ||
            (role === "teacher" && !classPassword),
        },
          role === "teacher" ? "教員として参加" : "クラスに参加"
        )
      )
    )
  );
}

function IssuedUserIdNotice({ identity, onClose }) {
  const [copyStatus, setCopyStatus] = useState("");
  const idInputRef = useRef(null);

  const copyUserId = () => {
    const input = idInputRef.current;
    let copied = false;
    if (input) {
      input.focus();
      input.select();
      input.setSelectionRange(0, input.value.length);
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      }
    }

    const finish = (succeeded) => {
      setCopyStatus(succeeded ? "コピーしました" : "IDを選択しました。コピーしてください");
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(identity.userId)
          .then(() => finish(true))
          .catch(() => finish(copied));
        return;
      }
    } catch {}
    finish(copied);
  };

  return h("div", { className: "issued-id-overlay" },
    h("section", {
      className: "issued-id-dialog",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "issued-id-title",
    },
      h("div", { className: "issued-id-icon" }, h(CheckCircle2, { size: 30 })),
      h("span", null, identity.className),
      h("h2", { id: "issued-id-title" }, "利用者IDを発行しました"),
      h("p", null, "次にこのクラスへ入るときに使います。忘れないように控えてください。"),
      h("div", { className: "issued-id-value" },
        h("input", {
          ref: idInputRef,
          value: identity.userId,
          readOnly: true,
          "aria-label": "発行された利用者ID",
          onClick: (event) => event.currentTarget.select(),
        }),
        h("button", {
          type: "button",
          onClick: copyUserId,
          title: "利用者IDをコピー",
          "aria-label": "利用者IDをコピー",
        }, copyStatus === "コピーしました" ? h(CheckCircle2, { size: 20 }) : h(Clipboard, { size: 20 }))
      ),
      copyStatus && h("small", { className: "issued-id-status", role: "status" }, copyStatus),
      h("button", { type: "button", className: "primary-button", onClick: onClose }, "確認しました")
    )
  );
}

function ClassBanner({ membership, activeClass, setScreen }) {
  if (!activeClass) return null;
  const isTeacher = membership.role === "teacher";
  return h("article", { className: "class-banner" },
    h("div", { className: "class-banner-top" },
      h("div", { className: `role-icon ${isTeacher ? "teacher" : "student"}` },
        h(isTeacher ? School : GraduationCap, { size: 22 })
      ),
      h("div", null,
        h("span", null, isTeacher ? "教員" : "生徒"),
        h("h2", null, activeClass.name)
      )
    ),
    membership.userId && h("div", { className: "class-user-id-row" },
      h("span", null, "利用者ID"),
      h("strong", null, membership.userId)
    ),
    isTeacher
      ? h(React.Fragment, null,
          h("div", { className: "class-code-row" },
            h("span", null, "参加コード"),
            h("strong", null, activeClass.code),
            h(Clipboard, { size: 18 })
          ),
          setScreen && h("button", { className: "dashboard-link", onClick: () => setScreen("dashboard") },
            h(ChartNoAxesColumnIncreasing, { size: 18 }),
            "クラスのダッシュボードを見る",
            h(ChevronRight, { size: 18 })
          )
        )
      : h("p", null, `${activeClass.teacher} のクラスに参加中`)
  );
}

function TeacherDashboard({ activeClass, quizzes, classProfiles, setScreen }) {
  const [copyStatus, setCopyStatus] = useState("");
  const codeInputRef = useRef(null);
  if (!activeClass) return null;
  const members = activeClass.members || [];
  const activeStudentCount = activeClass.activeStudentCount || 0;
  const challengeTotal = quizzes.reduce((total, quiz) => total + quiz.solvedCount, 0);

  const copyCode = () => {
    const codeInput = codeInputRef.current;
    let legacyCopied = false;

    if (codeInput) {
      codeInput.focus();
      codeInput.select();
      codeInput.setSelectionRange(0, codeInput.value.length);
      try {
        legacyCopied = document.execCommand("copy");
      } catch {
        legacyCopied = false;
      }
    }

    const showResult = (succeeded) => {
      setCopyStatus(succeeded ? "コピーしました" : "コードを選択しました。コピーしてください");
      setTimeout(() => setCopyStatus(""), 2200);
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(activeClass.code)
          .then(() => showResult(true))
          .catch(() => showResult(legacyCopied));
        return;
      }
    } catch {}

    showResult(legacyCopied);
  };

  return h("section", { className: "screen" },
    h(Header, {
      eyebrow: "Class dashboard",
      title: activeClass.name,
      body: `${activeClass.teacher}・教員用ダッシュボード`,
    }),
    h("article", { className: "dashboard-code-card" },
      h("div", null,
        h("span", null, "生徒の参加コード"),
        h("input", {
          ref: codeInputRef,
          className: "dashboard-code-value",
          value: activeClass.code,
          readOnly: true,
          "aria-label": "生徒の参加コード",
          onClick: (event) => event.currentTarget.select(),
        })
      ),
      h("button", {
        type: "button",
        onClick: copyCode,
        title: "コードをコピー",
        "aria-label": "参加コードをコピー",
      },
        copyStatus === "コピーしました" ? h(CheckCircle2, { size: 20 }) : h(Clipboard, { size: 20 })
      ),
      copyStatus && h("small", { role: "status" }, copyStatus)
    ),
    h("div", { className: "dashboard-stats" },
      h(DashboardStat, { icon: Users, value: activeStudentCount, label: "現在の入室生徒" }),
      h(DashboardStat, { icon: BookOpen, value: quizzes.length, label: "クイズ" }),
      h(DashboardStat, { icon: Trophy, value: challengeTotal, label: "挑戦回数" })
    ),
    h("section", { className: "dashboard-section" },
      h("div", { className: "section-title-row" },
        h("div", null, h("span", null, "Live"), h("h2", null, "現在の入室状況")),
        h("strong", null, `${activeStudentCount}人`)
      ),
      h("div", { className: "empty-dashboard" },
        h(Users, { size: 25 }),
        h("strong", null, "過去に参加した生徒の一覧は表示しません"),
        h("p", null, "この欄はリアルタイムの入室数だけを確認する場所にしました。")
      )
    ),
    h("section", { className: "dashboard-section" },
      h("div", { className: "section-title-row" },
        h("div", null, h("span", null, "Quizzes"), h("h2", null, "最近のクイズ")),
        h("button", { onClick: () => setScreen("create") }, h(Plus, { size: 17 }), "作問")
      ),
      h("div", { className: "dashboard-quiz-list" },
        quizzes.slice(0, 3).map((quiz) => h("article", { key: quiz.id },
          h("div", null, h("strong", null, quiz.title), h("span", null, `${quiz.subject}・${quiz.difficulty}`)),
          h("small", null, `${quiz.solvedCount}回挑戦`)
        ))
      )
    )
  );
}

function DashboardStat({ icon, value, label }) {
  return h("article", null, h(icon, { size: 20 }), h("strong", null, value), h("span", null, label));
}

function HomeScreen({ setScreen, membership, activeClass }) {
  const actions = [
    ["クイズを解く", "4択で気軽に挑戦", BookOpen, "quizzes"],
    ["クイズを作る", "理解を形にする", PencilLine, "create"],
    ["トーク", "リプライで学び合う", Users, "study"],
    ["プロフィール", "正解数より挑戦数", CircleUserRound, "profile"],
  ];
  return h("section", { className: "screen home-screen" },
    h(Header, { eyebrow: "qpath", title: "「間違えて良い」から始まる学び", body: "挑戦・作問・トークを大切にするクイズ共有プロトタイプ" }),
    h(ClassBanner, { membership, activeClass, setScreen }),
    h("div", { className: "hero-card" },
      h("div", null, h("strong", null, "今日の合言葉"), h("p", null, "挑戦したことが学びです。ここから理解が深まります。")),
      h(Lightbulb, { size: 36 })
    ),
    h("button", { className: "developer-note-link", type: "button", onClick: () => setScreen("updates") },
      h("div", { className: "developer-note-link-icon" }, h(FileText, { size: 21 })),
      h("div", null,
        h("strong", null, "開発者ノート"),
        h("span", null, "β版のアップデートと改善内容")
      ),
      h(ChevronRight, { size: 19 })
    ),
    h("div", { className: "action-grid" },
      actions.map(([label, detail, Icon, target]) =>
        h("button", { className: "action-card", key: label, onClick: () => setScreen(target) },
          h(Icon, { size: 24 }), h("span", null, label), h("small", null, detail), h(ChevronRight, { size: 18 })
        )
      )
    )
  );
}

function DeveloperNotesScreen({ notes, publishNote, deleteNote }) {
  const emptyDraft = { id: "", version: "", category: "アップデート", title: "", body: "" };
  const [isDeveloper, setIsDeveloper] = useState(
    () => localStorage.getItem(STORAGE.developerAccess) === DEVELOPER_KEY_HASH
  );
  const [showUnlock, setShowUnlock] = useState(false);
  const [developerKey, setDeveloperKey] = useState("");
  const [accessMessage, setAccessMessage] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const orderedNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    [notes]
  );

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const resetDraft = () => setDraft(emptyDraft);
  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ""
      : new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(date);
  };

  const unlockDeveloperMode = async (event) => {
    event.preventDefault();
    setAccessMessage("");
    try {
      const hashed = await hashDeveloperKey(developerKey.trim());
      if (hashed !== DEVELOPER_KEY_HASH) {
        setAccessMessage("開発者キーを確認してください。");
        return;
      }
      localStorage.setItem(STORAGE.developerAccess, DEVELOPER_KEY_HASH);
      setIsDeveloper(true);
      setShowUnlock(false);
      setDeveloperKey("");
    } catch (error) {
      setAccessMessage(error.message || "開発者キーを確認できませんでした。");
    }
  };

  const lockDeveloperMode = () => {
    localStorage.removeItem(STORAGE.developerAccess);
    setIsDeveloper(false);
    setShowUnlock(false);
    resetDraft();
  };

  const submitNote = async (event) => {
    event.preventDefault();
    if (!draft.version.trim() || !draft.title.trim() || !draft.body.trim()) return;
    setSaving(true);
    setSaveMessage("");
    await publishNote(draft);
    setSaving(false);
    setSaveMessage(draft.id ? "アップデートノートを更新しました。" : "アップデートノートを公開しました。");
    resetDraft();
  };

  const editNote = (note) => {
    setDraft({
      id: note.id,
      version: note.version || "",
      category: note.category || "アップデート",
      title: note.title || "",
      body: note.body || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return h("section", { className: "screen update-screen" },
    h(Header, {
      eyebrow: "Beta update log",
      title: "開発者ノート",
      body: "qpath β版のアップデートと改善内容をお知らせします。",
    }),
    h("article", { className: "update-intro" },
      h("div", null, h(Megaphone, { size: 22 })),
      h("p", null, "みなさんの挑戦をもとに、学びやすさを少しずつ更新しています。")
    ),
    isDeveloper
      ? h("section", { className: "developer-editor" },
          h("div", { className: "developer-editor-heading" },
            h("div", null, h("span", null, "Developer only"), h("h2", null, draft.id ? "ノートを編集" : "更新内容を投稿")),
            h("button", {
              type: "button",
              className: "icon-text-button",
              onClick: lockDeveloperMode,
            }, h(LockKeyhole, { size: 16 }), "ロック")
          ),
          h("form", { onSubmit: submitNote },
            field("バージョン", h("input", {
              value: draft.version,
              onChange: (event) => updateDraft("version", event.target.value.slice(0, 20)),
              placeholder: "例：β 0.5",
              maxLength: 20,
              required: true,
            })),
            field("種類", h("select", {
              value: draft.category,
              onChange: (event) => updateDraft("category", event.target.value),
            },
              ["アップデート", "改善", "お知らせ", "メンテナンス"].map((category) =>
                h("option", { key: category, value: category }, category)
              )
            )),
            field("タイトル", h("input", {
              value: draft.title,
              onChange: (event) => updateDraft("title", event.target.value.slice(0, 60)),
              placeholder: "更新内容のタイトル",
              maxLength: 60,
              required: true,
            })),
            field("本文", h("textarea", {
              value: draft.body,
              onChange: (event) => updateDraft("body", event.target.value.slice(0, 500)),
              placeholder: "どこが変わったか、利用者に伝わる言葉で入力します。",
              rows: 5,
              maxLength: 500,
              required: true,
            })),
            saveMessage && h("p", { className: "soft-message", role: "status" }, saveMessage),
            h("div", { className: "developer-editor-actions" },
              draft.id && h("button", { type: "button", className: "secondary-button", onClick: resetDraft }, "編集をやめる"),
              h("button", {
                type: "submit",
                className: "primary-button",
                disabled: saving || !draft.version.trim() || !draft.title.trim() || !draft.body.trim(),
              }, h(Send, { size: 17 }), saving ? "保存中..." : draft.id ? "更新する" : "公開する")
            )
          )
        )
      : h("div", { className: "developer-access" },
          showUnlock
            ? h("form", { className: "developer-unlock-form", onSubmit: unlockDeveloperMode },
                field("開発者キー", h("input", {
                  type: "password",
                  value: developerKey,
                  onChange: (event) => {
                    setDeveloperKey(event.target.value);
                    setAccessMessage("");
                  },
                  autoComplete: "off",
                  placeholder: "開発者キーを入力",
                  required: true,
                })),
                accessMessage && h("p", { className: "form-error", role: "alert" }, accessMessage),
                h("div", { className: "developer-editor-actions" },
                  h("button", { type: "button", className: "secondary-button", onClick: () => setShowUnlock(false) }, "閉じる"),
                  h("button", { type: "submit", className: "primary-button", disabled: !developerKey.trim() }, h(KeyRound, { size: 16 }), "開発者として開く")
                )
              )
            : h("button", {
                type: "button",
                className: "developer-unlock-button",
                onClick: () => setShowUnlock(true),
              }, h(LockKeyhole, { size: 15 }), "開発者用")
        ),
    h("div", { className: "update-note-list" },
      orderedNotes.map((note) =>
        h("article", { className: "update-note-card", key: note.id },
          h("div", { className: "update-note-meta" },
            h("span", { className: `update-category ${note.category || "アップデート"}` }, note.category || "アップデート"),
            h("strong", null, note.version || "β版")
          ),
          h("h2", null, note.title),
          h("p", null, note.body),
          h("footer", null,
            h("time", { dateTime: note.publishedAt }, formatDate(note.publishedAt)),
            isDeveloper && !note.isDefault && h("div", { className: "update-note-actions" },
              h("button", {
                type: "button",
                onClick: () => editNote(note),
                title: "このノートを編集",
                "aria-label": `${note.title}を編集`,
              }, h(Edit3, { size: 16 })),
              h("button", {
                type: "button",
                onClick: () => {
                  if (window.confirm("このアップデートノートを削除しますか？")) deleteNote(note.id);
                },
                title: "このノートを削除",
                "aria-label": `${note.title}を削除`,
              }, h(Trash2, { size: 16 }))
            )
          )
        )
      )
    )
  );
}

function QuizList({ quizzes, openQuiz, message, clearMessage, developerMode = false, deleteQuiz }) {
  const [practiceMode, setPracticeMode] = useState(developerMode ? "manage" : "");
  const [selectedSubject, setSelectedSubject] = useState("");
  const subjectGroups = useMemo(() => getSubjectGroups(quizzes), [quizzes]);
  const subjectQuizzes = selectedSubject
    ? quizzes.filter((quiz) => quiz.subject === selectedSubject)
    : [];
  const visibleQuizzes = developerMode || practiceMode === "all"
    ? quizzes
    : practiceMode === "subject"
      ? subjectQuizzes
      : [];

  const startQuizPool = (quizPool) => {
    if (!quizPool.length) return;
    openQuiz(quizPool[0].id, quizPool);
  };

  useEffect(() => {
    if (selectedSubject && !subjectGroups.some((group) => group.subject === selectedSubject)) {
      setSelectedSubject("");
    }
  }, [selectedSubject, subjectGroups]);

  return h("section", { className: "screen" },
    h(Header, {
      eyebrow: developerMode ? "Developer management" : "Quiz",
      title: developerMode ? "クイズ一覧" : "問題を解く",
      body: developerMode
        ? "開発者管理モードです。このクラスで作成された問題を確認・削除できます。"
        : "全体から回すか、科目を絞って回すかを選べます。"
    }),
    developerMode && h("div", { className: "developer-mode-notice", role: "status" },
      h(LockKeyhole, { size: 18 }),
      h("span", null, "開発者管理モード"),
      h("small", null, "削除した問題は元に戻せません")
    ),
    message && h("button", { className: "notice", onClick: clearMessage }, h(CheckCircle2, { size: 18 }), message),
    !developerMode && h("section", { className: "quiz-mode-card", "aria-labelledby": "quiz-mode-title" },
      h("div", { className: "quiz-mode-heading" },
        h("span", null, "出題範囲"),
        h("h2", { id: "quiz-mode-title" }, "どの問題を回しますか？")
      ),
      h("div", { className: "quiz-mode-selector" },
        h("button", {
          className: `quiz-mode-choice ${practiceMode === "all" ? "selected" : ""}`,
          type: "button",
          disabled: quizzes.length === 0,
          "aria-pressed": practiceMode === "all",
          onClick: () => {
            setPracticeMode("all");
            setSelectedSubject("");
          },
        },
          h(Sparkles, { size: 21 }),
          h("span", null, "全体から回す"),
          h("small", null, `${quizzes.length}問から挑戦`)
        ),
        h("button", {
          className: `quiz-mode-choice ${practiceMode === "subject" ? "selected" : ""}`,
          type: "button",
          disabled: subjectGroups.length === 0,
          "aria-pressed": practiceMode === "subject",
          onClick: () => {
            setPracticeMode("subject");
            setSelectedSubject("");
          },
        },
          h(BookOpen, { size: 21 }),
          h("span", null, "科目ごとに回す"),
          h("small", null, "科目を選んで挑戦")
        )
      ),
      practiceMode === "all" && h("div", { className: "quiz-mode-start" },
        h("p", null, `このクラスの${quizzes.length}問を順番に回します。`),
        h("button", {
          className: "primary-button",
          type: "button",
          disabled: quizzes.length === 0,
          onClick: () => startQuizPool(quizzes),
        }, h(Sparkles, { size: 18 }), "全体から挑戦を始める")
      ),
      practiceMode === "subject" && h(React.Fragment, null,
        h("p", { className: "quiz-subject-prompt" }, "挑戦する科目を選んでください。"),
        h("div", { className: "subject-filter", "aria-label": "挑戦する科目を選ぶ" },
          subjectGroups.map((group) =>
            h("button", {
              className: `subject-filter-button ${selectedSubject === group.subject ? "active" : ""}`,
              type: "button",
              key: group.subject,
              "aria-pressed": selectedSubject === group.subject,
              onClick: () => setSelectedSubject(group.subject),
            }, `${group.subject} ${group.count}`)
          )
        ),
        selectedSubject && h("div", { className: "quiz-mode-start" },
          h("p", null, `${selectedSubject}の${subjectQuizzes.length}問を順番に回します。`),
          h("button", {
            className: "primary-button",
            type: "button",
            disabled: subjectQuizzes.length === 0,
            onClick: () => startQuizPool(subjectQuizzes),
          }, h(BookOpen, { size: 18 }), `${selectedSubject}から挑戦を始める`)
        )
      )
    ),
    (developerMode || practiceMode === "all" || (practiceMode === "subject" && selectedSubject)) && h("div", { className: "quiz-list" },
      !developerMode && h("div", { className: "quiz-list-heading" },
        h("span", null, "問題一覧"),
        h("strong", null, practiceMode === "all" ? `全体 ${visibleQuizzes.length}問` : `${selectedSubject} ${visibleQuizzes.length}問`)
      ),
      visibleQuizzes.length === 0 && h("article", { className: "empty-card" },
        h("strong", null, "この問題群にはまだクイズがありません"),
        h("p", null, "作問も大切な学びです。最初の一問を作ってみましょう。")
      ),
      visibleQuizzes.map((quiz) =>
        h("article", { className: "quiz-card", key: quiz.id },
          h("div", { className: "card-top" }, h("span", { className: "subject" }, quiz.subject), h("span", { className: `difficulty ${quiz.difficulty}` }, quiz.difficulty)),
          h("h2", null, quiz.title),
          h("p", null, quiz.question),
          h("div", { className: "meta-row" }, h("span", null, quiz.author), h("span", null, `${quiz.solvedCount} 回挑戦`), h("span", null, `${quiz.likes} いい問題`)),
          h("div", { className: "quiz-card-actions" },
            h("button", { className: "primary-button", onClick: () => openQuiz(quiz.id, visibleQuizzes) }, "挑戦する"),
            developerMode && !isSampleQuiz(quiz) && h("button", {
              className: "developer-delete-button",
              type: "button",
              title: "このクイズを削除",
              "aria-label": `${quiz.title}を削除`,
              onClick: () => {
                if (window.confirm(`「${quiz.title}」を削除しますか？この操作は元に戻せません。`)) {
                  deleteQuiz?.(quiz.id);
                }
              },
            }, h(Trash2, { size: 18 }), h("span", null, "削除"))
          )
        )
      )
    )
  );
}

function AnswerScreen({ quiz, recordAnswer, quizProgress, goToNextQuiz }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [result, setResult] = useState(null);
  const answerLockedRef = useRef(false);
  const resultRef = useRef(null);
  const correctChoiceIndex = getCorrectChoiceIndex(quiz);

  const retryCurrentQuiz = () => {
    answerLockedRef.current = false;
    setSelectedIndex(null);
    setResult(null);
  };

  useEffect(() => { retryCurrentQuiz(); }, [quiz.id, quizProgress?.current]);

  useEffect(() => {
    if (!result || !resultRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      resultRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [result]);

  const answerNow = (index) => {
    if (answerLockedRef.current) return;
    answerLockedRef.current = true;

    const isUnknown = index === -1;
    const hasValidAnswer = correctChoiceIndex >= 0 && correctChoiceIndex < quiz.choices.length;
    const isCorrect = hasValidAnswer && !isUnknown && index === correctChoiceIndex;
    setSelectedIndex(index);
    setResult({ isCorrect, isUnknown, hasValidAnswer });

    if (hasValidAnswer) {
      try {
        recordAnswer(quiz, isCorrect);
      } catch (error) {
        console.error("回答記録の保存中に問題が発生しました。", error);
      }
    }
  };

  return h("section", { className: "screen" },
    h(Header, { eyebrow: quiz.subject, title: quiz.title, body: `${quiz.difficulty}・${quiz.author}` }),
    h("article", { className: "answer-card" },
      quizProgress && h("p", { className: "session-progress" }, `${quizProgress.current} / ${quizProgress.total} 問目`),
      h("p", { className: "question-text" }, quiz.question),
      h("div", { className: "choice-list" },
        quiz.choices.map((choice, index) =>
          h("button", {
            type: "button",
            className: [
              "choice-button",
              selectedIndex === index ? "selected" : "",
              result && index === correctChoiceIndex ? "correct" : "",
              result && selectedIndex === index && !result.isCorrect ? "incorrect" : "",
            ].filter(Boolean).join(" "),
            key: `${index}-${choice}`,
            onClick: () => answerNow(index),
            disabled: !!result,
            "aria-pressed": selectedIndex === index,
          }, h("span", null, String.fromCharCode(65 + index)), choice)
        ),
        h("button", {
          type: "button",
          className: `choice-button unknown-choice ${selectedIndex === -1 ? "selected incorrect" : ""}`,
          onClick: () => answerNow(-1),
          disabled: !!result,
          "aria-pressed": selectedIndex === -1,
        }, h("span", null, "?"), "分からない")
      ),
      !result
        ? h("p", { className: "tap-answer-note" }, "選択肢を押すと、そのまま判定に進みます。")
        : h("div", {
          className: `result-box ${result.isCorrect ? "positive" : "learning"}`,
          ref: resultRef,
          tabIndex: -1,
          role: "status",
          "aria-live": "polite",
        },
          !result.hasValidAnswer
            ? h(React.Fragment, null,
                h("strong", null, "この問題の正解設定を読み取れませんでした"),
                h("p", null, "作問者が編集画面で正解を選び直すと、判定できるようになります。"),
                h("div", { className: "answer-actions" },
                  h("button", { className: "secondary-button", type: "button", onClick: retryCurrentQuiz }, h(RotateCcw, { size: 16 }), "もう一度確認する")
                )
              )
            : h(React.Fragment, null,
                h("strong", null, result.isCorrect ? "正解です！" : "不正解でも、間違えて良い。ここから学べます"),
                !result.isCorrect && h("p", null, "挑戦したことが学びです。ここから理解が深まります。"),
                h("div", { className: "explanation" }, h("span", null, "解説"), h("p", null, quiz.explanation)),
                quizProgress && !quizProgress.hasNext && result.isCorrect && h("p", { className: "complete-message" }, "解き始めた時点の問題をすべて挑戦しました。挑戦したことが学びです。"),
                h("div", { className: "answer-actions" },
                  (result.isCorrect || quizProgress?.hasNext) &&
                    h("button", { className: "secondary-button", type: "button", onClick: retryCurrentQuiz }, h(RotateCcw, { size: 16 }), "もう一回挑戦"),
                  h("button", {
                    className: "primary-button",
                    type: "button",
                    onClick: () => !result.isCorrect && !quizProgress?.hasNext
                      ? retryCurrentQuiz()
                      : goToNextQuiz(result.isCorrect),
                  },
                    quizProgress?.hasNext ? "次の問題へ" : result.isCorrect ? "ホームへ戻る" : "もう一度挑戦する",
                    h(ChevronRight, { size: 18 })
                  )
                )
              )
        )
    )
  );
}

function CreateScreen({ createQuiz, editingQuiz }) {
  const initial = editingQuiz
    ? {
        title: editingQuiz.title || "",
        subject: editingQuiz.subject || "",
        question: editingQuiz.question || "",
        choices: editingQuiz.choices || ["", "", "", ""],
        correctAnswer: editingQuiz.correctAnswer || "",
        explanation: editingQuiz.explanation || "",
        difficulty: editingQuiz.difficulty || "普通",
      }
    : { title: "", subject: "", question: "", choices: ["", "", "", ""], correctAnswer: "", explanation: "", difficulty: "普通" };
  const [form, setForm] = useState(initial);
  const [note, setNote] = useState("");
  useEffect(() => { setForm(initial); }, [editingQuiz?.id]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateChoice = (index, value) => setForm((current) => {
    const choices = [...current.choices];
    const old = choices[index];
    choices[index] = value;
    return { ...current, choices, correctAnswer: current.correctAnswer === old ? value : current.correctAnswer };
  });
  const canSubmit = form.title.trim() && form.subject.trim() && form.question.trim() && form.choices.every((choice) => choice.trim()) && form.correctAnswer && form.explanation.trim();
  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) {
      setNote("入力できるところから整えていきましょう。");
      return;
    }
    createQuiz(form);
    if (!editingQuiz) setForm(initial);
  };
  return h("section", { className: "screen" },
    h(Header, {
      eyebrow: editingQuiz ? "Edit" : "Create",
      title: editingQuiz ? "クイズを編集" : "クイズを作る",
      body: editingQuiz ? "自分で作った問題を、さらに伝わりやすく整えましょう。" : "作問も大切な学びです。考えた道すじを解説に残そう。",
    }),
    h("form", { className: "form-card", onSubmit: submit },
      field("タイトル", h("input", { value: form.title, onChange: (e) => update("title", e.target.value), placeholder: "例：比例の基本" })),
      field("教科", h("select", {
        className: "subject-select",
        name: "subject",
        value: form.subject,
        onChange: (e) => update("subject", e.target.value),
        required: true,
        "aria-label": "教科を選択",
      },
        h("option", { value: "", disabled: true }, "教科を選択してください"),
        SUBJECT_OPTIONS.map((subject) => h("option", { value: subject, key: subject }, subject))
      )),
      field("難易度", h("select", { value: form.difficulty, onChange: (e) => update("difficulty", e.target.value) }, h("option", null, "簡単"), h("option", null, "普通"), h("option", null, "難しい"))),
      field("問題文", h("textarea", { value: form.question, onChange: (e) => update("question", e.target.value), placeholder: "問題文を入力", rows: 3 })),
      h("div", { className: "choice-editor" },
        h("span", null, "選択肢 A〜D"),
        form.choices.map((choice, index) => h("label", { className: "choice-input", key: index }, String.fromCharCode(65 + index), h("input", { value: choice, onChange: (e) => updateChoice(index, e.target.value), placeholder: `選択肢${String.fromCharCode(65 + index)}` })))
      ),
      field("正解", h("select", { value: form.correctAnswer, onChange: (e) => update("correctAnswer", e.target.value) },
        h("option", { value: "" }, "選択してください"),
        form.choices.map((choice, index) => h("option", { value: choice, key: index, disabled: !choice.trim() }, `${String.fromCharCode(65 + index)}: ${choice || "未入力"}`))
      )),
      field("解説", h("textarea", { value: form.explanation, onChange: (e) => update("explanation", e.target.value), placeholder: "考え方や覚え方を書いてください", rows: 4 })),
      note && h("p", { className: "soft-message" }, note),
      h("button", { className: "primary-button", type: "submit" }, h(Plus, { size: 18 }), editingQuiz ? "更新する" : "作成して共有")
    ),
    h(RevenueCard)
  );
}

function field(label, control) {
  return h("label", null, label, control);
}

function TalkProfileTrigger({ identity, profileKey, isOpen, setOpenProfileKey, compact = false }) {
  const roleLabel = identity.role === "teacher" ? "教員" : identity.role === "student" ? "生徒" : "クラスメンバー";
  return h("div", {
    className: "talk-profile-anchor",
    onMouseEnter: () => setOpenProfileKey(profileKey),
    onMouseLeave: () => setOpenProfileKey((current) => current === profileKey ? "" : current),
    onBlur: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setOpenProfileKey((current) => current === profileKey ? "" : current);
      }
    },
  },
    h("button", {
      type: "button",
      className: compact ? "talk-profile-trigger compact" : "talk-profile-trigger",
      onClick: () => setOpenProfileKey(profileKey),
      onFocus: () => setOpenProfileKey(profileKey),
      "aria-expanded": isOpen,
      "aria-label": `${identity.name}のプロフィールを見る`,
    },
      h("div", {
        className: compact ? "avatar reply-avatar" : "avatar",
        style: { background: identity.avatarColor },
        "aria-hidden": "true",
      }, identity.initial),
      h("strong", null, identity.name)
    ),
    isOpen && h("aside", {
      className: "talk-profile-popover",
      role: "dialog",
      "aria-label": `${identity.name}のプロフィール`,
    },
      h("div", { className: "talk-profile-popover-header" },
        h("div", {
          className: "avatar talk-profile-popover-avatar",
          style: { background: identity.avatarColor },
          "aria-hidden": "true",
        }, identity.initial),
        h("div", null,
          h("strong", null, identity.name),
          h("span", { className: "talk-profile-role" }, roleLabel)
        )
      ),
      h("p", null, identity.bio || "一言はまだ設定されていません")
    )
  );
}

function StudyScreen({ comments, activeClass, addComment: onAddComment, addReply, reactToComment }) {
  const [text, setText] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [openProfileKey, setOpenProfileKey] = useState("");
  useEffect(() => {
    const closeProfile = (event) => {
      if (!event.target?.closest?.(".talk-profile-anchor")) setOpenProfileKey("");
    };
    document.addEventListener("pointerdown", closeProfile);
    return () => document.removeEventListener("pointerdown", closeProfile);
  }, []);
  const submitComment = () => {
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText("");
  };
  const submitReply = (id) => {
    const reply = (replyDrafts[id] || "").trim();
    if (!reply) return;
    addReply(id, reply);
    setReplyDrafts((current) => ({ ...current, [id]: "" }));
  };
  const reactionChoices = ["😊", "🥰", "🫡", "😯"];
  return h("section", { className: "screen" },
    h(Header, { eyebrow: "Talk", title: "トーク", body: "気づきにリプライして、SNSのように学び合えます。" }),
    h("div", { className: "comment-box" },
      h("textarea", { value: text, onChange: (e) => setText(e.target.value), placeholder: "気づき、質問、ここから理解が深まったことを書いてみよう", rows: 3 }),
      h("button", { className: "primary-button", onClick: submitComment }, h(Send, { size: 17 }), "投稿")
    ),
    h("div", { className: "comment-list" },
      comments.map((comment) => {
        const commentAuthor = getTalkIdentity(comment, activeClass);
        const commentProfileKey = `comment:${comment.id}`;
        return h("article", { className: "comment-card", key: comment.id },
          h(TalkProfileTrigger, {
            identity: commentAuthor,
            profileKey: commentProfileKey,
            isOpen: openProfileKey === commentProfileKey,
            setOpenProfileKey,
          }),
          h("p", null, comment.text),
          h("div", { className: "reaction-row" },
            reactionChoices.map((reaction) => h("button", {
              key: reaction,
              onClick: () => reactToComment(comment.id, reaction),
              "aria-label": `${reaction}でリアクション`,
            }, `${reaction} ${(comment.reactions || {})[reaction] || 0}`))
          ),
          (comment.replies || []).length > 0 && h("div", { className: "reply-list" },
            (comment.replies || []).map((reply) => {
              const replyAuthor = getTalkIdentity(reply, activeClass);
              const replyProfileKey = `reply:${comment.id}:${reply.id}`;
              return h("div", { className: "reply-card", key: reply.id },
                h(TalkProfileTrigger, {
                  identity: replyAuthor,
                  profileKey: replyProfileKey,
                  isOpen: openProfileKey === replyProfileKey,
                  setOpenProfileKey,
                  compact: true,
                }),
                h("p", null, reply.text)
              );
            })
          ),
          h("div", { className: "reply-box" },
            h("input", {
              value: replyDrafts[comment.id] || "",
              onChange: (event) => setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value })),
              placeholder: "リプライを書く",
            }),
            h("button", { type: "button", onClick: () => submitReply(comment.id) }, h(Send, { size: 15 }))
          )
        );
      })
    )
  );
}

function SimpleBars({ title, data }) {
  const entries = Object.entries(data || {}).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return h("div", { className: "bar-card" },
    h("h3", null, title),
    entries.length
      ? entries.map(([label, value]) => h("div", { className: "bar-row", key: label },
          h("span", null, label),
          h("div", { className: "bar-track" }, h("div", { className: "bar-fill", style: { width: `${Math.max(8, Math.round((value / max) * 100))}%` } })),
          h("strong", null, value)
        ))
      : h("p", null, "まだ記録がありません。挑戦したことが学びです。")
  );
}

function SubjectBars({ title, answered, correct }) {
  const subjects = Array.from(new Set([...Object.keys(answered || {}), ...Object.keys(correct || {})]));
  const entries = subjects.map((subject) => {
    const attempts = answered[subject] || 0;
    const correctCount = correct[subject] || 0;
    return { subject, attempts, accuracy: attempts ? Math.round((correctCount / attempts) * 100) : 0 };
  }).filter((item) => item.attempts > 0).sort((a, b) => b.attempts - a.attempts).slice(0, 6);
  return h("div", { className: "bar-card" },
    h("h3", null, title),
    entries.length
      ? entries.map((item) => h("div", { className: "bar-row", key: item.subject },
          h("span", null, item.subject),
          h("div", { className: "bar-track" }, h("div", { className: "bar-fill", style: { width: `${Math.max(8, item.accuracy)}%` } })),
          h("strong", null, `${item.accuracy}%`)
        ))
      : h("p", null, "まだ傾向はありません。ここから理解が深まります。")
  );
}

function ProfileScreen({ profile, classProfile, membership, activeClass, classProfiles, resetRole, setScreen, ownQuizzes, editOwnQuiz, updateProfile, developerMode = false }) {
  const roleLabel = developerMode ? "開発者" : membership.role === "teacher" ? "教員" : "生徒";
  const displayProfile = classProfile || profile;
  const studentMembers = membership.role === "teacher" ? (activeClass?.members || []) : [];
  const [draftName, setDraftName] = useState(displayProfile.name || profile.name);
  const [draftBio, setDraftBio] = useState(normalizeBio(displayProfile.bio));
  const [savedNote, setSavedNote] = useState("");
  useEffect(() => {
    setDraftName(displayProfile.name || profile.name);
    setDraftBio(normalizeBio(displayProfile.bio));
  }, [displayProfile.name, displayProfile.bio, profile.name]);
  const solvedCount = displayProfile.solvedCount || 0;
  const correctCount = displayProfile.correctCount || 0;
  const accuracy = solvedCount ? Math.round((correctCount / solvedCount) * 100) : 0;
  return h("section", { className: "screen" },
    h(Header, { eyebrow: "Profile", title: "プロフィール", body: "正解数より挑戦数を見えるようにしています。" }),
    h("article", { className: "profile-card" },
      h("div", { className: "big-avatar", style: { background: displayProfile.avatarColor || pickAvatarColor(membership.userId) } }, (displayProfile.name || profile.name || "匿").slice(0, 1)),
      h("h2", null, displayProfile.name || profile.name),
      h("span", { className: "role-badge" }, roleLabel),
      h("span", { className: "user-id-badge" }, `利用者ID: ${membership.userId || "未発行"}`),
      normalizeBio(displayProfile.bio) && h("p", null, normalizeBio(displayProfile.bio)),
      h("p", null, "正解数より、挑戦した数を大切にしています")
    ),
    h("form", {
      className: "profile-edit-card",
      onSubmit: (event) => {
        event.preventDefault();
        updateProfile({ name: draftName.trim() || "匿名ユーザー", bio: draftBio.trim() });
        setSavedNote("プロフィールを保存しました。");
        setTimeout(() => setSavedNote(""), 1800);
      },
    },
      field("表示名", h("input", {
        value: draftName,
        onChange: (event) => setDraftName(event.target.value.slice(0, 20)),
        maxLength: 20,
      })),
      field("プロフィールの一言", h("textarea", {
        value: draftBio,
        onChange: (event) => setDraftBio(event.target.value.slice(0, 80)),
        rows: 2,
        maxLength: 80,
      })),
      h("div", { className: "avatar-color-picker", "aria-label": "アイコン色を選ぶ" },
        AVATAR_COLORS.map((color) => h("button", {
          type: "button",
          key: color,
          className: (displayProfile.avatarColor || pickAvatarColor(membership.userId)) === color ? "selected" : "",
          style: { background: color },
          onClick: () => updateProfile({ avatarColor: color }),
          "aria-label": `${color}を選ぶ`,
        }))
      ),
      savedNote && h("p", { className: "soft-message" }, savedNote),
      h("button", { className: "secondary-button", type: "submit" }, "プロフィールを保存")
    ),
    h(ClassBanner, { membership, activeClass, setScreen }),
    membership.role === "teacher" && h("section", { className: "student-id-card" },
      h("div", { className: "section-title-row" },
        h("div", null,
          h("span", null, "Student IDs"),
          h("h2", null, "生徒の名前と利用者ID")
        ),
        h("strong", null, `${studentMembers.length}人`)
      ),
      h("p", { className: "student-id-note" }, "生徒が利用者IDを忘れたときに、ここから確認できます。"),
      studentMembers.length
        ? h("div", { className: "student-id-list" },
            studentMembers.map((student) => {
              const studentProfile = classProfiles[getProfileKey(activeClass.id, student.id)];
              const studentName = studentProfile?.name || student.name || "匿名ユーザー";
              return h("article", { key: student.id },
                h("div", {
                  className: "student-id-avatar",
                  style: { background: studentProfile?.avatarColor || pickAvatarColor(student.id) },
                }, studentName.slice(0, 1)),
                h("div", null,
                  h("strong", null, studentName),
                  h("span", null, student.id)
                )
              );
            })
          )
        : h("div", { className: "empty-dashboard" },
            h(Users, { size: 24 }),
            h("strong", null, "参加済みの生徒はまだいません"),
            h("p", null, "生徒が初めて入室すると、名前と利用者IDが表示されます。")
          )
    ),
    h("div", { className: "stats-grid" },
      h(Stat, { label: "作成したクイズ数", value: displayProfile.createdCount || 0, icon: Edit3 }),
      h(Stat, { label: "解いたクイズ数", value: displayProfile.solvedCount || 0, icon: BookOpen }),
      h(Stat, { label: "挑戦回数", value: displayProfile.challengeCount || 0, icon: Trophy })
    ),
    h("section", { className: "analytics-card" },
      h("div", { className: "analytics-summary" },
        h("div", null, h("strong", null, `${accuracy}%`), h("span", null, "正答率")),
        h("div", null, h("strong", null, solvedCount), h("span", null, "解いた数")),
        h("div", null, h("strong", null, displayProfile.solvedCreatedCount || 0), h("span", null, "解かれた数"))
      ),
      h(SubjectBars, { title: "得意・これから伸びる教科", answered: displayProfile.answeredBySubject || {}, correct: displayProfile.correctBySubject || {} }),
      h(SimpleBars, { title: "作問の教科傾向", data: displayProfile.createdBySubject || {} })
    ),
    h("section", { className: "profile-quiz-card" },
      h("div", { className: "section-title-row" },
        h("div", null, h("span", null, "My quizzes"), h("h2", null, "自分が作ったクイズ")),
        h("strong", null, `${ownQuizzes.length}問`)
      ),
      ownQuizzes.length
        ? h("div", { className: "profile-quiz-list" },
            ownQuizzes.map((quiz) => h("article", { key: quiz.id },
              h("div", null,
                h("strong", null, quiz.title),
                h("span", null, `${quiz.subject}・${quiz.difficulty}`)
              ),
              h("button", { type: "button", onClick: () => editOwnQuiz(quiz.id) }, h(Edit3, { size: 16 }), "編集")
            ))
          )
        : h("div", { className: "empty-dashboard" },
            h(Edit3, { size: 24 }),
            h("strong", null, "まだ自作クイズはありません"),
            h("p", null, "作問も大切な学びです。")
          )
    ),
    h(RevenueCard),
    h("button", { className: "role-reset-button", onClick: resetRole },
      h(LogOut, { size: 17 }),
      "役割とクラスを選び直す"
    )
  );
}

function Stat({ label, value, icon }) {
  return h("article", { className: "stat-card" }, h(icon, { size: 20 }), h("strong", null, value), h("span", null, label));
}

function RevenueCard() {
  return h("article", { className: "revenue-card" }, h(Heart, { size: 22 }), h("p", null, "将来的には、多くの人に解かれた良質なクイズを作成したユーザーに、収益を分配する仕組みを導入予定です。"));
}

function BottomNav({ current, setScreen }) {
  const items = [
    ["profile", "プロフィール", CircleUserRound],
    ["quizzes", "クイズ", BookOpen],
    ["home", "ホーム", House],
    ["study", "トーク", MessageCircle],
    ["create", "作問", PencilLine],
  ];
  return h("nav", { className: "bottom-nav" },
    items.map(([key, label, Icon]) => {
      const active =
        current === key ||
        (key === "quizzes" && current === "answer") ||
        (key === "profile" && current === "dashboard");
      return h("button", { key, className: active ? "active" : "", onClick: () => setScreen(key) }, h(Icon, { size: 21 }), h("span", null, label));
    })
  );
}

createRoot(document.getElementById("root")).render(h(App));
