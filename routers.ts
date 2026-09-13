import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    setNickname: protectedProcedure
      .input(z.object({ nickname: z.string().min(1).max(100) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserNickname(ctx.user.id, input.nickname);
        return { success: true };
      }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().max(255).optional(),
        nickname: z.string().min(1).max(100).optional(),
        email: z.string().email().max(320).optional(),
        role: z.enum(["user", "admin", "teacher"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Classes & Schools
  classes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserClasses(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        schoolId: z.number(),
        name: z.string().min(1).max(255),
        code: z.string().min(1).max(20),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createClass(
          input.schoolId,
          input.name,
          input.code,
          ctx.user.id,
          input.description
        );
        return { success: true };
      }),
    join: protectedProcedure
      .input(z.object({ code: z.string().min(1).max(20) }))
      .mutation(async ({ ctx, input }) => {
        const classRecord = await db.getClassByCode(input.code);
        if (!classRecord) throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });

        await db.addClassMember(classRecord.id, ctx.user.id);
        return { success: true, classId: classRecord.id };
      }),
    getMembers: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ ctx, input }) => {
        const isUserInClass = await db.isUserInClass(input.classId, ctx.user.id);
        if (!isUserInClass) throw new TRPCError({ code: "FORBIDDEN" });

        return await db.getClassMembers(input.classId);
      }),
    generateCode: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const classRecord = await db.getClassById(input.classId);
        if (!classRecord) throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
        if (classRecord.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only class creator or admin can generate codes" });
        }

        const code = await db.generateClassCode(input.classId);
        return { code, success: true };
      }),
    getCode: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ ctx, input }) => {
        const isUserInClass = await db.isUserInClass(input.classId, ctx.user.id);
        if (!isUserInClass) throw new TRPCError({ code: "FORBIDDEN" });

        const code = await db.getClassCode(input.classId);
        return { code };
      }),
  }),

  // Quizzes
  quizzes: router({
    create: protectedProcedure
      .input(z.object({
        classId: z.number(),
        title: z.string().min(1).max(255),
        type: z.enum(["multiple_choice", "fill_blank"]),
        content: z.record(z.string(), z.any()),
        explanation: z.string().min(1),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const isUserInClass = await db.isUserInClass(input.classId, ctx.user.id);
        if (!isUserInClass) throw new TRPCError({ code: "FORBIDDEN" });

        await db.createQuiz(
          ctx.user.id,
          input.classId,
          input.title,
          input.type,
          input.content,
          input.explanation,
          input.tags
        );
        return { success: true };
      }),
    get: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getQuizById(input.quizId);
      }),
    list: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ ctx, input }) => {
        const isUserInClass = await db.isUserInClass(input.classId, ctx.user.id);
        if (!isUserInClass) throw new TRPCError({ code: "FORBIDDEN" });

        return await db.getClassQuizzes(input.classId, 50, 0);
      }),
  }),

  // Quiz Files
  quizFiles: router({
    list: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ ctx, input }) => {
        const isUserInClass = await db.isUserInClass(input.classId, ctx.user.id);
        if (!isUserInClass) throw new TRPCError({ code: "FORBIDDEN" });

        return await db.getQuizFilesByClass(input.classId);
      }),
    create: protectedProcedure
      .input(z.object({
        classId: z.number(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const isUserInClass = await db.isUserInClass(input.classId, ctx.user.id);
        if (!isUserInClass) throw new TRPCError({ code: "FORBIDDEN" });

        await db.createQuizFile(input.classId, ctx.user.id, input.name, input.description);
        return { success: true };
      }),
    get: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getQuizFile(input.fileId);
      }),
    getQuizzes: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getQuizzesByFile(input.fileId);
      }),
    delete: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const file = await db.getQuizFile(input.fileId);
        if (!file) throw new TRPCError({ code: "NOT_FOUND" });
        if (file.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.deleteQuizFile(input.fileId);
        return { success: true };
      }),
  }),

  // Quiz Answers
  answers: router({
    submit: protectedProcedure
      .input(z.object({ quizId: z.number(), answer: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const quiz = await db.getQuizById(input.quizId);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });

        const content = quiz.content as any;
        const isCorrect = input.answer === content.answer;

        await db.createQuizAnswer(input.quizId, ctx.user.id, input.answer, isCorrect);
        return { isCorrect };
      }),
    getMyAnswer: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserQuizAnswer(input.quizId, ctx.user.id);
      }),
  }),

  // Comments
  comments: router({
    create: protectedProcedure
      .input(z.object({ quizId: z.number(), content: z.string().min(1).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        await db.createQuizComment(input.quizId, ctx.user.id, input.content);
        return { success: true };
      }),
    list: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getQuizComments(input.quizId);
      }),
  }),

  // Reactions
  reactions: router({
    add: protectedProcedure
      .input(z.object({ quizId: z.number(), type: z.enum(["great", "difficult", "interesting"]) }))
      .mutation(async ({ ctx, input }) => {
        await db.createQuizReaction(input.quizId, ctx.user.id, input.type);
        return { success: true };
      }),
    list: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getQuizReactions(input.quizId);
      }),
  }),

  // Battle Rooms
  battles: router({
    createRoom: protectedProcedure
      .input(z.object({ classId: z.number(), code: z.string().min(1).max(20), quizzes: z.array(z.number()).optional() }))
      .mutation(async ({ ctx, input }) => {
        const isUserInClass = await db.isUserInClass(input.classId, ctx.user.id);
        if (!isUserInClass) throw new TRPCError({ code: "FORBIDDEN" });

        await db.createBattleRoom(input.classId, input.code, ctx.user.id, input.quizzes);
        return { success: true };
      }),
    joinRoom: protectedProcedure
      .input(z.object({ code: z.string().min(1).max(20) }))
      .query(async ({ ctx, input }) => {
        const room = await db.getBattleRoomByCode(input.code);
        if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

        const isUserInClass = await db.isUserInClass(room.classId, ctx.user.id);
        if (!isUserInClass) throw new TRPCError({ code: "FORBIDDEN" });

        return room;
      }),
  }),

  // Admin
  admin: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return await db.getAdminStats();
    }),
    getUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return await db.getAllUsers(100, 0);
    }),
    getQuizzes: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return await db.getAllQuizzes(100, 0);
    }),
  }),

  // Admin Codes
  adminCodes: router({
    generate: protectedProcedure
      .input(z.object({
        expiresAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only allow admins to generate codes
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can generate codes" });
        }
        const code = await db.generateAdminCode(ctx.user.id, input.expiresAt);
        return { code, success: true };
      }),
    useCode: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.validateAndUseAdminCode(input.code, ctx.user.id);
        if (!success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired code" });
        }
        return { success: true };
      }),
    list: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view codes" });
        }
        return await db.getAdminCodesByCreator(ctx.user.id);
      }),
    deactivate: protectedProcedure
      .input(z.object({ codeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can deactivate codes" });
        }
        await db.deactivateAdminCode(input.codeId);
        return { success: true };
      }),
  }),

  // Personal Learning Mode
  personalLearning: router({
    getOrCreateCard: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getOrCreateLearningCard(ctx.user.id, input.quizId);
      }),
    updateCardStatus: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        status: z.enum(["learning", "mastered", "reviewing"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateLearningCardStatus(input.cardId, input.status);
        return { success: true };
      }),
    incrementReviewCount: protectedProcedure
      .input(z.object({ cardId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.incrementReviewCount(input.cardId);
        return { success: true };
      }),
    getUserCards: protectedProcedure
      .input(z.object({ status: z.enum(["learning", "mastered", "reviewing"]).optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserLearningCards(ctx.user.id, input.status);
      }),
    recordProgress: protectedProcedure
      .input(z.object({
        date: z.string(),
        masteredCount: z.number(),
        reviewedCount: z.number(),
        totalLearningTime: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.recordLearningProgress(
          ctx.user.id,
          input.date,
          input.masteredCount,
          input.reviewedCount,
          input.totalLearningTime
        );
        return { success: true };
      }),
    getProgress: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        return await db.getUserLearningProgress(ctx.user.id, input.days);
      }),
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getLearningStats(ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
