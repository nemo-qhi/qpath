import { eq, and, sql, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, schools, classes, classMembers, quizzes, quizAnswers, quizComments, quizReactions, battleRooms, battleScores, adminCodes, InsertAdminCode, personalLearningCards, learningProgress, quizFiles } from "../drizzle/schema";
import { ENV } from './_core/env';
import { desc } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ========== User Management ==========

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "nickname"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserNickname(userId: number, nickname: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ nickname }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: { name?: string; nickname?: string; email?: string; role?: "user" | "admin" | "teacher" }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name || null;
  if (data.nickname !== undefined) updateData.nickname = data.nickname || null;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.role !== undefined) updateData.role = data.role;

  if (Object.keys(updateData).length === 0) return;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

// ========== Schools & Classes ==========

export async function createSchool(name: string, code: string, createdBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schools).values({
    name,
    code,
    createdBy,
  });

  return result;
}

export async function getSchoolByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schools).where(eq(schools.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClass(schoolId: number, name: string, code: string, createdBy: number, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(classes).values({
    schoolId,
    name,
    code,
    createdBy,
    description,
  });
  
  // クラス作成者（先生）を自動的にクラスメンバーとして登録
  const createdClass = await db.select().from(classes).where(eq(classes.code, code)).limit(1);
  if (createdClass.length > 0) {
    await db.insert(classMembers).values({
      classId: createdClass[0].id,
      userId: createdBy,
    });
  }
  
  return result;
}

export async function getClassByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(classes).where(eq(classes.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getClassById(classId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserClasses(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(classes)
    .innerJoin(classMembers, eq(classMembers.classId, classes.id))
    .where(eq(classMembers.userId, userId));

  return result.map(r => r.classes);
}

export async function getClassMembers(classId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(users)
    .innerJoin(classMembers, eq(classMembers.userId, users.id))
    .where(eq(classMembers.classId, classId));

  return result.map(r => r.users);
}

export async function addClassMember(classId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(classMembers).values({
    classId,
    userId,
  });

  return result;
}

// ========== Class Codes (Invitation Codes) ==========

export async function generateClassCode(classId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate a unique code (6-character alphanumeric)
  let code = "";
  let isUnique = false;
  
  while (!isUnique) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await db.select().from(classes).where(eq(classes.code, code)).limit(1);
    isUnique = existing.length === 0;
  }

  // Update the class with the new code
  await db.update(classes).set({ code }).where(eq(classes.id, classId));
  
  return code;
}

export async function getClassCode(classId: number): Promise<{ code: string | undefined; codeExpiresAt: Date | null | undefined }> {
  const db = await getDb();
  if (!db) return { code: undefined, codeExpiresAt: undefined };

  const result = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
  if (result.length > 0) {
    return { code: result[0].code, codeExpiresAt: result[0].codeExpiresAt };
  }
  return { code: undefined, codeExpiresAt: undefined };
}

export async function isUserInClass(classId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(classMembers)
    .where(and(eq(classMembers.classId, classId), eq(classMembers.userId, userId)))
    .limit(1);

  return result.length > 0;
}

// ========== Quizzes ==========

export async function createQuiz(
  createdBy: number,
  classId: number,
  title: string,
  type: "multiple_choice" | "fill_blank",
  content: any,
  explanation: string,
  tags?: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quizzes).values({
    createdBy,
    classId,
    title,
    type,
    content,
    explanation,
    tags: tags ? JSON.stringify(tags) : null,
  });

  return result;
}

export async function getClassQuizzes(classId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.classId, classId))
    .orderBy(desc(quizzes.createdAt))
    .limit(limit)
    .offset(offset);
  return result;
}

export async function getQuizById(quizId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateQuizAnswerCount(quizId: number, isCorrect: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const quiz = await getQuizById(quizId);
  if (!quiz) throw new Error("Quiz not found");

  await db.update(quizzes).set({
    answerCount: quiz.answerCount + 1,
    correctCount: isCorrect ? quiz.correctCount + 1 : quiz.correctCount,
  }).where(eq(quizzes.id, quizId));
}

// ========== Quiz Answers ==========

export async function createQuizAnswer(
  quizId: number,
  userId: number,
  answer: string,
  isCorrect: boolean,
  timeSpent?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quizAnswers).values({
    quizId,
    userId,
    answer,
    isCorrect,
    timeSpent,
  });

  // Update quiz stats
  await updateQuizAnswerCount(quizId, isCorrect);

  return result;
}

export async function getUserQuizAnswer(quizId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(quizAnswers)
    .where(and(eq(quizAnswers.quizId, quizId), eq(quizAnswers.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function markExplanationViewed(answerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(quizAnswers).set({ viewedExplanation: true }).where(eq(quizAnswers.id, answerId));
}

export async function incrementRetryCount(answerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const answer = await db.select().from(quizAnswers).where(eq(quizAnswers.id, answerId)).limit(1);
  if (answer.length === 0) throw new Error("Answer not found");

  await db.update(quizAnswers).set({ retryCount: answer[0].retryCount + 1 }).where(eq(quizAnswers.id, answerId));
}

// ========== Quiz Comments & Reactions ==========

export async function createQuizComment(quizId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quizComments).values({
    quizId,
    userId,
    content,
  });

  return result;
}

export async function getQuizComments(quizId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(quizComments)
    .where(eq(quizComments.quizId, quizId))
    .orderBy((qc) => qc.createdAt);

  return result;
}

export async function deleteQuizComment(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(quizComments).where(eq(quizComments.id, commentId));
}

export async function createQuizReaction(quizId: number, userId: number, type: "great" | "difficult" | "interesting") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quizReactions).values({
    quizId,
    userId,
    type,
  });

  return result;
}

export async function getQuizReactions(quizId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(quizReactions)
    .where(eq(quizReactions.quizId, quizId));

  return result;
}

// ========== Battle Rooms ==========

// ========== Admin Stats ==========

export async function getAdminStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
  const quizCount = await db.select({ count: sql<number>`count(*)` }).from(quizzes);
  const answerCount = await db.select({ count: sql<number>`count(*)` }).from(quizAnswers);
  const battleCount = await db.select({ count: sql<number>`count(*)` }).from(battleRooms);

  const correctAnswers = await db
    .select({ count: sql<number>`count(*)` })
    .from(quizAnswers)
    .where(eq(quizAnswers.isCorrect, true));

  const totalAnswers = answerCount[0]?.count || 0;
  const correctCount = correctAnswers[0]?.count || 0;
  const averageAccuracy = totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0;

  return {
    totalUsers: userCount[0]?.count || 0,
    activeUsers: Math.floor((userCount[0]?.count || 0) * 0.7), // Mock: 70% active
    totalQuizzes: quizCount[0]?.count || 0,
    totalAnswers: totalAnswers,
    totalBattleRooms: battleCount[0]?.count || 0,
    averageAccuracy: averageAccuracy,
  };
}

export async function getAllUsers(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(users)
    .limit(limit)
    .offset(offset);

  return result;
}

export async function getAllQuizzes(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(quizzes)
    .limit(limit)
    .offset(offset);

  // Get answer stats for each quiz
  const quizzesWithStats = await Promise.all(
    result.map(async (quiz) => {
      const answers = await db
        .select({ count: sql<number>`count(*)` })
        .from(quizAnswers)
        .where(eq(quizAnswers.quizId, quiz.id));

      const correct = await db
        .select({ count: sql<number>`count(*)` })
        .from(quizAnswers)
        .where(and(eq(quizAnswers.quizId, quiz.id), eq(quizAnswers.isCorrect, true)));

      return {
        ...quiz,
        answerCount: answers[0]?.count || 0,
        correctCount: correct[0]?.count || 0,
      };
    })
  );

  return quizzesWithStats;
}

export async function createBattleRoom(classId: number, code: string, createdBy: number, quizzes?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(battleRooms).values({
    classId,
    code,
    createdBy,
    quizzes: quizzes ? JSON.stringify(quizzes) : null,
  });

  return result;
}

export async function getBattleRoomByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(battleRooms).where(eq(battleRooms.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBattleRoomById(roomId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(battleRooms).where(eq(battleRooms.id, roomId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBattleRoomStatus(roomId: number, status: "waiting" | "active" | "finished") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(battleRooms).set({ status }).where(eq(battleRooms.id, roomId));
}

// ========== Battle Scores ==========

export async function createBattleScore(
  roomId: number,
  userId: number,
  score: number,
  correctCount: number,
  participationPoints: number,
  speedPoints: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(battleScores).values({
    roomId,
    userId,
    score,
    correctCount,
    participationPoints,
    speedPoints,
  });

  return result;
}

export async function getBattleScores(roomId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(battleScores)
    .where(eq(battleScores.roomId, roomId))
    .orderBy((bs) => bs.score);

  return result;
}

export async function updateBattleScore(
  roomId: number,
  userId: number,
  score: number,
  correctCount: number,
  participationPoints: number,
  speedPoints: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(battleScores)
    .where(and(eq(battleScores.roomId, roomId), eq(battleScores.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(battleScores).set({
      score,
      correctCount,
      participationPoints,
      speedPoints,
    }).where(and(eq(battleScores.roomId, roomId), eq(battleScores.userId, userId)));
  } else {
    await createBattleScore(roomId, userId, score, correctCount, participationPoints, speedPoints);
  }
}


// ========== Admin Codes ==========

export async function generateAdminCode(createdBy: number, expiresAt?: Date): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // ユニークなコードを生成（crypto.randomBytes を使用してセキュア）
  const crypto = await import("crypto");
  let code = "";
  let isUnique = false;
  let retries = 0;
  const maxRetries = 5;

  while (!isUnique && retries < maxRetries) {
    code = crypto.randomBytes(16).toString("hex").toUpperCase().substring(0, 24);
    
    // コードの一意性を確認
    const existing = await db
      .select()
      .from(adminCodes)
      .where(eq(adminCodes.code, code))
      .limit(1);
    
    isUnique = existing.length === 0;
    retries++;
  }

  if (!isUnique) {
    throw new Error("Failed to generate unique admin code");
  }

  await db.insert(adminCodes).values({
    code,
    createdBy,
    isActive: true,
    expiresAt: expiresAt || undefined,
  });

  return code;
}

export async function validateAndUseAdminCode(code: string, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(adminCodes)
    .where(and(eq(adminCodes.code, code), eq(adminCodes.isActive, true)))
    .limit(1);

  if (result.length === 0) return false;

  const adminCode = result[0];

  // 有効期限チェック
  if (adminCode.expiresAt && new Date() > adminCode.expiresAt) {
    return false;
  }

  // コードを使用済みにマーク
  await db.update(adminCodes).set({
    usedBy: userId,
    usedAt: new Date(),
    isActive: false, // 1回限りの使用
  }).where(eq(adminCodes.id, adminCode.id));

  // ユーザーをadminに昇格
  await db.update(users).set({ role: "admin" }).where(eq(users.id, userId));

  return true;
}

export async function getAdminCodesByCreator(createdBy: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(adminCodes)
    .where(eq(adminCodes.createdBy, createdBy));

  return result;
}

export async function deactivateAdminCode(codeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(adminCodes).set({ isActive: false }).where(eq(adminCodes.id, codeId));
}


// ========== Personal Learning Mode ==========

export async function getOrCreateLearningCard(userId: number, quizId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 既存のカードを確認
  const existing = await db
    .select()
    .from(personalLearningCards)
    .where(and(eq(personalLearningCards.userId, userId), eq(personalLearningCards.quizId, quizId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // 新規カードを作成
  await db.insert(personalLearningCards).values({
    userId,
    quizId,
    status: "learning",
  });

  const created = await db
    .select()
    .from(personalLearningCards)
    .where(and(eq(personalLearningCards.userId, userId), eq(personalLearningCards.quizId, quizId)))
    .limit(1);

  return created[0];
}

export async function updateLearningCardStatus(cardId: number, status: "learning" | "mastered" | "reviewing") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (status === "mastered") {
    updateData.masteredAt = new Date();
  }
  updateData.lastReviewedAt = new Date();

  await db.update(personalLearningCards).set(updateData).where(eq(personalLearningCards.id, cardId));
}

export async function incrementReviewCount(cardId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const card = await db.select().from(personalLearningCards).where(eq(personalLearningCards.id, cardId)).limit(1);
  if (card.length === 0) throw new Error("Card not found");

  await db
    .update(personalLearningCards)
    .set({
      reviewCount: (card[0].reviewCount || 0) + 1,
      lastReviewedAt: new Date(),
    })
    .where(eq(personalLearningCards.id, cardId));
}

export async function getUserLearningCards(userId: number, status?: "learning" | "mastered" | "reviewing") {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(personalLearningCards).where(eq(personalLearningCards.userId, userId));

  if (status) {
    query = db
      .select()
      .from(personalLearningCards)
      .where(and(eq(personalLearningCards.userId, userId), eq(personalLearningCards.status, status)));
  }

  return query;
}

export async function recordLearningProgress(userId: number, date: string, masteredCount: number, reviewedCount: number, totalLearningTime: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 既存のレコードを確認
  const existing = await db
    .select()
    .from(learningProgress)
    .where(and(eq(learningProgress.userId, userId), eq(learningProgress.date, date)))
    .limit(1);

  if (existing.length > 0) {
    // 既存レコードを更新
    await db
      .update(learningProgress)
      .set({
        masteredCount: existing[0].masteredCount + masteredCount,
        reviewedCount: existing[0].reviewedCount + reviewedCount,
        totalLearningTime: existing[0].totalLearningTime + totalLearningTime,
      })
      .where(and(eq(learningProgress.userId, userId), eq(learningProgress.date, date)));
  } else {
    // 新規レコードを作成
    await db.insert(learningProgress).values({
      userId,
      date,
      masteredCount,
      reviewedCount,
      totalLearningTime,
    });
  }
}

export async function getUserLearningProgress(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  // 過去N日間のデータを取得
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split("T")[0];

  const result = await db
    .select()
    .from(learningProgress)
    .where(and(eq(learningProgress.userId, userId), gte(learningProgress.date, startDateStr)))
    .orderBy(learningProgress.date);

  return result;
}

export async function getLearningStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  // 習得したカード数
  const masteredCards = await db
    .select({ count: sql`COUNT(*)` })
    .from(personalLearningCards)
    .where(and(eq(personalLearningCards.userId, userId), eq(personalLearningCards.status, "mastered")));

  // 学習中のカード数
  const learningCards = await db
    .select({ count: sql`COUNT(*)` })
    .from(personalLearningCards)
    .where(and(eq(personalLearningCards.userId, userId), eq(personalLearningCards.status, "learning")));

  // 復習中のカード数
  const reviewingCards = await db
    .select({ count: sql`COUNT(*)` })
    .from(personalLearningCards)
    .where(and(eq(personalLearningCards.userId, userId), eq(personalLearningCards.status, "reviewing")));

  // 今日の学習時間
  const today = new Date().toISOString().split("T")[0];
  const todayProgress = await db
    .select()
    .from(learningProgress)
    .where(and(eq(learningProgress.userId, userId), eq(learningProgress.date, today)))
    .limit(1);

  return {
    masteredCount: Number(masteredCards[0]?.count || 0),
    learningCount: Number(learningCards[0]?.count || 0),
    reviewingCount: Number(reviewingCards[0]?.count || 0),
    todayLearningTime: todayProgress[0]?.totalLearningTime || 0,
  };
}


// ========== Quiz Files ==========

export async function createQuizFile(classId: number, createdBy: number, name: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quizFiles).values({
    classId,
    createdBy,
    name,
    description,
  });

  return result;
}

export async function getQuizFilesByClass(classId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(quizFiles)
    .where(eq(quizFiles.classId, classId))
    .orderBy(desc(quizFiles.createdAt));
}

export async function getQuizFile(fileId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(quizFiles)
    .where(eq(quizFiles.id, fileId))
    .limit(1);

  return result[0] || null;
}

export async function updateQuizFile(fileId: number, name?: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;

  if (Object.keys(updates).length === 0) return;

  await db.update(quizFiles).set(updates).where(eq(quizFiles.id, fileId));
}

export async function deleteQuizFile(fileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(quizFiles).where(eq(quizFiles.id, fileId));
}

export async function getQuizzesByFile(fileId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.fileId, fileId))
    .orderBy(desc(quizzes.createdAt));
}
