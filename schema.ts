import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"), // 本名
  nickname: varchar("nickname", { length: 100 }), // ニックネーム
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "teacher"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Schools テーブル（学校）
export const schools = mysqlTable("schools", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(), // 招待コード
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;

// Classes テーブル（クラス・グループ）
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: int("schoolId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(), // 招待コード
  codeExpiresAt: timestamp("codeExpiresAt"), // コード有効期限
  codeIsActive: boolean("codeIsActive").default(true).notNull(), // コード無効化状態
  description: text("description"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

// ClassMembers テーブル（クラスメンバー）
export const classMembers = mysqlTable("classMembers", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  userId: int("userId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ClassMember = typeof classMembers.$inferSelect;
export type InsertClassMember = typeof classMembers.$inferInsert;

// QuizFiles テーブル（クイズファイル）
export const quizFiles = mysqlTable("quizFiles", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  createdBy: int("createdBy").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizFile = typeof quizFiles.$inferSelect;
export type InsertQuizFile = typeof quizFiles.$inferInsert;

// Quizzes テーブル（クイズ）
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  createdBy: int("createdBy").notNull(),
  classId: int("classId").notNull(),
  fileId: int("fileId"), // クイズファイルID（オプション）
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["multiple_choice", "fill_blank"]).notNull(),
  content: json("content").notNull(), // { question, choices?, answer, etc. }
  explanation: text("explanation").notNull(),
  tags: json("tags"), // JSON配列: ["数学", "代数"]
  isPublished: boolean("isPublished").default(true).notNull(),
  answerCount: int("answerCount").default(0).notNull(),
  correctCount: int("correctCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

// QuizAnswers テーブル（クイズ回答）
export const quizAnswers = mysqlTable("quizAnswers", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  userId: int("userId").notNull(),
  answer: text("answer").notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  viewedExplanation: boolean("viewedExplanation").default(false).notNull(),
  retryCount: int("retryCount").default(0).notNull(),
  timeSpent: int("timeSpent"), // ミリ秒
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type InsertQuizAnswer = typeof quizAnswers.$inferInsert;

// QuizComments テーブル（クイズコメント）
export const quizComments = mysqlTable("quizComments", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizComment = typeof quizComments.$inferSelect;
export type InsertQuizComment = typeof quizComments.$inferInsert;

// QuizReactions テーブル（クイズリアクション）
export const quizReactions = mysqlTable("quizReactions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["great", "difficult", "interesting"]).notNull(), // なるほど・難しい・面白い
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizReaction = typeof quizReactions.$inferSelect;
export type InsertQuizReaction = typeof quizReactions.$inferInsert;

// BattleRooms テーブル（対戦ルーム）
export const battleRooms = mysqlTable("battleRooms", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(), // ルームコード
  classId: int("classId").notNull(),
  createdBy: int("createdBy").notNull(),
  status: mysqlEnum("status", ["waiting", "active", "finished"]).default("waiting").notNull(),
  quizzes: json("quizzes"), // JSON配列: [quizId, ...]
  currentQuizIndex: int("currentQuizIndex").default(0).notNull(),
  maxParticipants: int("maxParticipants").default(50).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  finishedAt: timestamp("finishedAt"),
});

export type BattleRoom = typeof battleRooms.$inferSelect;
export type InsertBattleRoom = typeof battleRooms.$inferInsert;

// BattleScores テーブル（対戦スコア）
export const battleScores = mysqlTable("battleScores", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  userId: int("userId").notNull(),
  score: int("score").default(0).notNull(),
  correctCount: int("correctCount").default(0).notNull(),
  participationPoints: int("participationPoints").default(0).notNull(),
  speedPoints: int("speedPoints").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BattleScore = typeof battleScores.$inferSelect;
export type InsertBattleScore = typeof battleScores.$inferInsert;

// Admin Codes テーブル（管理者コード）
export const adminCodes = mysqlTable("adminCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(), // ユニークなコード
  createdBy: int("createdBy").notNull(), // 生成者のユーザーID
  usedBy: int("usedBy"), // 使用したユーザーID（nullなら未使用）
  isActive: boolean("isActive").default(true).notNull(), // 有効/無効
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"), // 使用日時
  expiresAt: timestamp("expiresAt"), // 有効期限（オプション）
});

export type AdminCode = typeof adminCodes.$inferSelect;
export type InsertAdminCode = typeof adminCodes.$inferInsert;

// Personal Learning Mode テーブル（個人学習モード - カード形式）
export const personalLearningCards = mysqlTable("personalLearningCards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 学習者
  quizId: int("quizId").notNull(), // クイズ
  status: mysqlEnum("status", ["learning", "mastered", "reviewing"]).default("learning").notNull(), // 学習状態
  reviewCount: int("reviewCount").default(0).notNull(), // 復習回数
  masteredAt: timestamp("masteredAt"), // 習得日時
  lastReviewedAt: timestamp("lastReviewedAt"), // 最後に復習した日時
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PersonalLearningCard = typeof personalLearningCards.$inferSelect;
export type InsertPersonalLearningCard = typeof personalLearningCards.$inferInsert;

// Learning Progress テーブル（学習進捗 - グラフ用）
export const learningProgress = mysqlTable("learningProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 学習者
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD形式
  masteredCount: int("masteredCount").default(0).notNull(), // その日に習得したクイズ数
  reviewedCount: int("reviewedCount").default(0).notNull(), // その日に復習したクイズ数
  totalLearningTime: int("totalLearningTime").default(0).notNull(), // その日の学習時間（秒）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningProgress = typeof learningProgress.$inferSelect;
export type InsertLearningProgress = typeof learningProgress.$inferInsert;
