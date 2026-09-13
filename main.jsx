import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Edit3,
  Heart,
  Home,
  Lightbulb,
  MessageCircle,
  PencilLine,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import "./styles.css";

const STORAGE_KEYS = {
  quizzes: "qpath.quizzes",
  profile: "qpath.profile",
  comments: "qpath.comments",
};

const sampleQuizzes = [
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

const blankQuiz = {
  title: "",
  subject: "",
  question: "",
  choices: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
  difficulty: "普通",
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [screen, setScreen] = useState("home");
  const [quizzes, setQuizzes] = useState(() => readStorage(STORAGE_KEYS.quizzes, sampleQuizzes));
  const [profile, setProfile] = useState(() =>
    readStorage(STORAGE_KEYS.profile, {
      name: "匿名ユーザー",
      createdCount: 0,
      solvedCount: 0,
      challengeCount: 0,
    })
  );
  const [comments, setComments] = useState(() => readStorage(STORAGE_KEYS.comments, sampleComments));
  const [activeQuizId, setActiveQuizId] = useState(sampleQuizzes[0].id);
  const [completionMessage, setCompletionMessage] = useState("");

  useEffect(() => localStorage.setItem(STORAGE_KEYS.quizzes, JSON.stringify(quizzes)), [quizzes]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(comments)), [comments]);

  const activeQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.id === activeQuizId) || quizzes[0],
    [activeQuizId, quizzes]
  );

  const openQuiz = (quizId) => {
    setActiveQuizId(quizId);
    setScreen("answer");
  };

  const createQuiz = (form) => {
    const newQuiz = {
      id: `quiz-${Date.now()}`,
      title: form.title.trim(),
      subject: form.subject.trim(),
      question: form.question.trim(),
      choices: form.choices.map((choice) => choice.trim()),
      correctAnswer: form.correctAnswer,
      explanation: form.explanation.trim(),
      difficulty: form.difficulty,
      author: "匿名ユーザー",
      solvedCount: 0,
      likes: 0,
    };
    setQuizzes((current) => [newQuiz, ...current]);
    setProfile((current) => ({ ...current, createdCount: current.createdCount + 1 }));
    setCompletionMessage("作問も大切な学びです！");
    setActiveQuizId(newQuiz.id);
    setScreen("quizzes");
  };

  const recordAnswer = (quizId) => {
    setQuizzes((current) =>
      current.map((quiz) => (quiz.id === quizId ? { ...quiz, solvedCount: quiz.solvedCount + 1 } : quiz))
    );
    setProfile((current) => ({
      ...current,
      solvedCount: current.solvedCount + 1,
      challengeCount: current.challengeCount + 1,
    }));
  };

  return (
    <div className="app-shell">
      <main className="phone-frame">
        {screen === "home" && <HomeScreen setScreen={setScreen} />}
        {screen === "quizzes" && (
          <QuizListScreen quizzes={quizzes} openQuiz={openQuiz} completionMessage={completionMessage} clearMessage={() => setCompletionMessage("")} />
        )}
        {screen === "answer" && activeQuiz && <AnswerScreen quiz={activeQuiz} recordAnswer={recordAnswer} />}
        {screen === "create" && <CreateQuizScreen createQuiz={createQuiz} />}
        {screen === "study" && <StudyScreen comments={comments} setComments={setComments} />}
        {screen === "profile" && <ProfileScreen profile={profile} />}
      </main>
      <BottomNav current={screen} setScreen={setScreen} />
    </div>
  );
}

function Header({ eyebrow, title, body }) {
  return (
    <header className="page-header">
      <div className="brand-mark">
        <Sparkles size={20} />
      </div>
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      {body && <span>{body}</span>}
    </header>
  );
}

function HomeScreen({ setScreen }) {
  const actions = [
    { label: "クイズを解く", detail: "4択で気軽に挑戦", icon: BookOpen, screen: "quizzes" },
    { label: "クイズを作る", detail: "理解を形にする", icon: PencilLine, screen: "create" },
    { label: "相互学習", detail: "コメントで学び合う", icon: Users, screen: "study" },
    { label: "プロフィール", detail: "正解数より挑戦数", icon: CircleUserRound, screen: "profile" },
  ];
  return (
    <section className="screen home-screen">
      <Header eyebrow="qpath" title="「間違えて良い」から始まる学び" body="挑戦・作問・相互学習を大切にするクイズ共有プロトタイプ" />
      <div className="hero-card">
        <div>
          <strong>今日の合言葉</strong>
          <p>挑戦したことが学びです。ここから理解が深まります。</p>
        </div>
        <Lightbulb size={36} />
      </div>
      <div className="action-grid">
        {actions.map((action) => (
          <button className="action-card" key={action.label} onClick={() => setScreen(action.screen)}>
            <action.icon size={24} />
            <span>{action.label}</span>
            <small>{action.detail}</small>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
    </section>
  );
}

function QuizListScreen({ quizzes, openQuiz, completionMessage, clearMessage }) {
  return (
    <section className="screen">
      <Header eyebrow="Quiz" title="クイズ一覧" body="匿名で作られた問題に、まずは一問だけ挑戦。" />
      {completionMessage && (
        <button className="notice" onClick={clearMessage}>
          <CheckCircle2 size={18} />
          {completionMessage}
        </button>
      )}
      <div className="quiz-list">
        {quizzes.map((quiz) => (
          <article className="quiz-card" key={quiz.id}>
            <div className="card-top">
              <span className="subject">{quiz.subject}</span>
              <span className={`difficulty ${quiz.difficulty}`}>{quiz.difficulty}</span>
            </div>
            <h2>{quiz.title}</h2>
            <p>{quiz.question}</p>
            <div className="meta-row">
              <span>{quiz.author}</span>
              <span>{quiz.solvedCount} 回挑戦</span>
              <span>{quiz.likes} いい問題</span>
            </div>
            <button className="primary-button" onClick={() => openQuiz(quiz.id)}>
              挑戦する
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AnswerScreen({ quiz, recordAnswer }) {
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    setSelected("");
    setResult(null);
  }, [quiz.id]);

  const submit = () => {
    const isCorrect = selected === quiz.correctAnswer;
    setResult({ isCorrect });
    recordAnswer(quiz.id);
  };

  return (
    <section className="screen">
      <Header eyebrow={quiz.subject} title={quiz.title} body={`${quiz.difficulty}・${quiz.author}`} />
      <article className="answer-card">
        <p className="question-text">{quiz.question}</p>
        <div className="choice-list">
          {quiz.choices.map((choice, index) => (
            <button
              className={`choice-button ${selected === choice ? "selected" : ""} ${result && choice === quiz.correctAnswer ? "correct" : ""}`}
              key={choice}
              onClick={() => !result && setSelected(choice)}
              disabled={!!result}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              {choice}
            </button>
          ))}
        </div>
        {!result ? (
          <button className="primary-button" disabled={!selected} onClick={submit}>
            回答する
          </button>
        ) : (
          <div className={`result-box ${result.isCorrect ? "positive" : "learning"}`}>
            <strong>{result.isCorrect ? "正解です！" : "不正解でも、間違えて良い。ここから学べます"}</strong>
            {!result.isCorrect && <p>挑戦したことが学びです。ここから理解が深まります。</p>}
            <div className="explanation">
              <span>解説</span>
              <p>{quiz.explanation}</p>
            </div>
            <button
              className="secondary-button"
              onClick={() => {
                setSelected("");
                setResult(null);
              }}
            >
              <RotateCcw size={16} />
              もう一回挑戦
            </button>
          </div>
        )}
      </article>
    </section>
  );
}

function CreateQuizScreen({ createQuiz }) {
  const [form, setForm] = useState(blankQuiz);
  const [message, setMessage] = useState("");

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateChoice = (index, value) =>
    setForm((current) => {
      const choices = [...current.choices];
      choices[index] = value;
      return { ...current, choices, correctAnswer: current.correctAnswer === choices[index] ? value : current.correctAnswer };
    });

  const canSubmit =
    form.title.trim() &&
    form.subject.trim() &&
    form.question.trim() &&
    form.choices.every((choice) => choice.trim()) &&
    form.correctAnswer &&
    form.explanation.trim();

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) {
      setMessage("入力できるところから整えていきましょう。");
      return;
    }
    createQuiz(form);
    setForm(blankQuiz);
  };

  return (
    <section className="screen">
      <Header eyebrow="Create" title="クイズを作る" body="作問も大切な学びです。考えた道すじを解説に残そう。" />
      <form className="form-card" onSubmit={submit}>
        <label>
          タイトル
          <input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="例：比例の基本" />
        </label>
        <div className="two-columns">
          <label>
            教科
            <input value={form.subject} onChange={(event) => update("subject", event.target.value)} placeholder="数学" />
          </label>
          <label>
            難易度
            <select value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)}>
              <option>簡単</option>
              <option>普通</option>
              <option>難しい</option>
            </select>
          </label>
        </div>
        <label>
          問題文
          <textarea value={form.question} onChange={(event) => update("question", event.target.value)} placeholder="問題文を入力" rows="3" />
        </label>
        <div className="choice-editor">
          <span>選択肢 A〜D</span>
          {form.choices.map((choice, index) => (
            <label className="choice-input" key={index}>
              {String.fromCharCode(65 + index)}
              <input value={choice} onChange={(event) => updateChoice(index, event.target.value)} placeholder={`選択肢${String.fromCharCode(65 + index)}`} />
            </label>
          ))}
        </div>
        <label>
          正解
          <select value={form.correctAnswer} onChange={(event) => update("correctAnswer", event.target.value)}>
            <option value="">選択してください</option>
            {form.choices.map((choice, index) => (
              <option value={choice} key={index} disabled={!choice.trim()}>
                {String.fromCharCode(65 + index)}: {choice || "未入力"}
              </option>
            ))}
          </select>
        </label>
        <label>
          解説
          <textarea value={form.explanation} onChange={(event) => update("explanation", event.target.value)} placeholder="考え方や覚え方を書いてください" rows="4" />
        </label>
        {message && <p className="soft-message">{message}</p>}
        <button className="primary-button" type="submit">
          <Plus size={18} />
          作成して共有
        </button>
      </form>
      <RevenueCard />
    </section>
  );
}

function StudyScreen({ comments, setComments }) {
  const [text, setText] = useState("");
  const addComment = () => {
    if (!text.trim()) return;
    setComments((current) => [
      { id: `comment-${Date.now()}`, author: "匿名ユーザー", text: text.trim(), reactions: { clear: 0, retry: 0, good: 0 } },
      ...current,
    ]);
    setText("");
  };
  const react = (id, key) => {
    setComments((current) =>
      current.map((comment) =>
        comment.id === id ? { ...comment, reactions: { ...comment.reactions, [key]: comment.reactions[key] + 1 } } : comment
      )
    );
  };
  return (
    <section className="screen">
      <Header eyebrow="Mutual Learning" title="相互学習" body="感じたことを残すと、次の人の学びになります。" />
      <div className="comment-box">
        <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="解き方の気づきや、もう一回挑戦したい理由を書いてみよう" rows="3" />
        <button className="primary-button" onClick={addComment}>
          <Send size={17} />
          投稿
        </button>
      </div>
      <div className="comment-list">
        {comments.map((comment) => (
          <article className="comment-card" key={comment.id}>
            <div className="avatar-row">
              <div className="avatar">匿</div>
              <strong>{comment.author}</strong>
            </div>
            <p>{comment.text}</p>
            <div className="reaction-row">
              <button onClick={() => react(comment.id, "clear")}>わかりやすい {comment.reactions.clear}</button>
              <button onClick={() => react(comment.id, "retry")}>もう一回挑戦したい {comment.reactions.retry}</button>
              <button onClick={() => react(comment.id, "good")}>いい問題 {comment.reactions.good}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileScreen({ profile }) {
  return (
    <section className="screen">
      <Header eyebrow="Profile" title="プロフィール" body="正解数より挑戦数を見えるようにしています。" />
      <article className="profile-card">
        <div className="big-avatar">匿</div>
        <h2>{profile.name}</h2>
        <p>正解数より、挑戦した数を大切にしています</p>
      </article>
      <div className="stats-grid">
        <Stat label="作成したクイズ数" value={profile.createdCount} icon={Edit3} />
        <Stat label="解いたクイズ数" value={profile.solvedCount} icon={BookOpen} />
        <Stat label="挑戦回数" value={profile.challengeCount} icon={Trophy} />
      </div>
      <RevenueCard />
    </section>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <article className="stat-card">
      <Icon size={20} />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function RevenueCard() {
  return (
    <article className="revenue-card">
      <Heart size={22} />
      <p>将来的には、多くの人に解かれた良質なクイズを作成したユーザーに、収益を分配する仕組みを導入予定です。</p>
    </article>
  );
}

function BottomNav({ current, setScreen }) {
  const items = [
    { key: "profile", label: "プロフィール", icon: CircleUserRound },
    { key: "quizzes", label: "クイズ", icon: BookOpen },
    { key: "study", label: "自習", icon: MessageCircle },
    { key: "create", label: "作問", icon: PencilLine },
  ];
  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const isActive = current === item.key || (item.key === "quizzes" && current === "answer");
        return (
          <button key={item.key} className={isActive ? "active" : ""} onClick={() => setScreen(item.key)}>
            <item.icon size={21} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

createRoot(document.getElementById("root")).render(<App />);
