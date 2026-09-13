import { Server as SocketIOServer, Socket } from "socket.io";
import * as db from "./db";

// In-memory store for active battle rooms
interface BattleParticipant {
  userId: number;
  nickname: string;
  currentQuizIndex: number;
  score: number;
  correctCount: number;
  participationPoints: number;
  speedPoints: number;
  lastAnswerTime: number;
}

interface ActiveBattleRoom {
  roomId: number;
  code: string;
  participants: Map<string, BattleParticipant>;
  quizzes: number[];
  currentQuizIndex: number;
  status: "waiting" | "active" | "finished";
  startTime: number;
}

const activeRooms = new Map<string, ActiveBattleRoom>();

export function initializeBattleSocket(io: SocketIOServer) {
  io.on("connection", (socket: Socket) => {
    console.log(`[Battle] User connected: ${socket.id}`);

    // Join battle room
    socket.on("battle:join", async (data: { code: string; userId: number; nickname: string }) => {
      try {
        const room = await db.getBattleRoomByCode(data.code);
        if (!room) {
          socket.emit("battle:error", { message: "Room not found" });
          return;
        }

        const roomKey = `room-${room.id}`;
        let activeRoom = activeRooms.get(roomKey);

        // Create active room if it doesn't exist
        if (!activeRoom) {
          const quizzes = room.quizzes ? JSON.parse(room.quizzes as any) : [];
          activeRoom = {
            roomId: room.id,
            code: room.code,
            participants: new Map(),
            quizzes,
            currentQuizIndex: 0,
            status: "waiting",
            startTime: Date.now(),
          };
          activeRooms.set(roomKey, activeRoom);
        }

        // Add participant
        const participant: BattleParticipant = {
          userId: data.userId,
          nickname: data.nickname,
          currentQuizIndex: 0,
          score: 0,
          correctCount: 0,
          participationPoints: 0,
          speedPoints: 0,
          lastAnswerTime: 0,
        };

        activeRoom.participants.set(socket.id, participant);
        socket.join(roomKey);

        // Broadcast updated participant list
        io.to(roomKey).emit("battle:participants-updated", {
          participants: Array.from(activeRoom.participants.values()).map(p => ({
            nickname: p.nickname,
            score: p.score,
            correctCount: p.correctCount,
          })),
        });

        // Auto-start battle if enough participants (or after 10 seconds)
        if (activeRoom.status === "waiting" && activeRoom.participants.size >= 1) {
          setTimeout(() => {
            if (activeRoom.status === "waiting") {
              startBattle(io, roomKey, activeRoom);
            }
          }, 10000);
        }

        socket.emit("battle:joined", {
          roomCode: room.code,
          participants: activeRoom.participants.size,
        });
      } catch (error) {
        console.error("[Battle] Join error:", error);
        socket.emit("battle:error", { message: "Failed to join room" });
      }
    });

    // Submit answer
    socket.on("battle:answer", async (data: { answer: string; timeSpent: number }) => {
      try {
        const roomKey = Array.from(socket.rooms).find(r => r.startsWith("room-"));
        if (!roomKey) return;

        const activeRoom = activeRooms.get(roomKey);
        if (!activeRoom) return;

        const participant = activeRoom.participants.get(socket.id);
        if (!participant) return;

        // Get current quiz
        if (activeRoom.currentQuizIndex >= activeRoom.quizzes.length) return;

        const quizId = activeRoom.quizzes[activeRoom.currentQuizIndex];
        const quiz = await db.getQuizById(quizId);
        if (!quiz) return;

        // Check answer
        const content = quiz.content as any;
        const isCorrect = data.answer === content.answer;

        // Calculate points
        const participationBonus = 10; // All participants get this
        const correctBonus = isCorrect ? 50 : 0;
        const speedBonus = Math.max(0, 100 - Math.floor(data.timeSpent / 100)); // Faster = more points

        participant.score += participationBonus + correctBonus + speedBonus;
        participant.participationPoints += participationBonus;
        if (isCorrect) {
          participant.correctCount += 1;
          participant.speedPoints += speedBonus;
        }
        participant.lastAnswerTime = Date.now();

        // Broadcast answer result
        io.to(roomKey).emit("battle:answer-result", {
          nickname: participant.nickname,
          isCorrect,
          pointsGained: participationBonus + correctBonus + speedBonus,
          totalScore: participant.score,
        });

        // Check if all participants answered
        const allAnswered = Array.from(activeRoom.participants.values()).every(
          p => p.lastAnswerTime > activeRoom.startTime
        );

        if (allAnswered) {
          // Move to next quiz
          activeRoom.currentQuizIndex += 1;

          if (activeRoom.currentQuizIndex >= activeRoom.quizzes.length) {
            // Battle finished
            finishBattle(io, roomKey, activeRoom);
          } else {
            // Send next quiz
            const nextQuizId = activeRoom.quizzes[activeRoom.currentQuizIndex];
            const nextQuiz = await db.getQuizById(nextQuizId);

            io.to(roomKey).emit("battle:next-quiz", {
              quizId: nextQuizId,
              title: nextQuiz?.title,
              type: nextQuiz?.type,
              content: nextQuiz?.content,
            });

            // Reset answer times for next round
            activeRoom.participants.forEach(p => {
              p.lastAnswerTime = 0;
            });
          }
        }
      } catch (error) {
        console.error("[Battle] Answer error:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`[Battle] User disconnected: ${socket.id}`);

      // Remove from active rooms
      const roomsToDelete: string[] = [];
      activeRooms.forEach((room, roomKey) => {
        if (room.participants.has(socket.id)) {
          room.participants.delete(socket.id);

          if (room.participants.size === 0) {
            roomsToDelete.push(roomKey as string);
          } else {
            // Broadcast updated participant list
            io.to(roomKey as string).emit("battle:participants-updated", {
              participants: Array.from(room.participants.values()).map(p => ({
                nickname: p.nickname,
                score: p.score,
                correctCount: p.correctCount,
              })),
            });
          }
        }
      });

      // Clean up empty rooms
      roomsToDelete.forEach((roomKey: string) => activeRooms.delete(roomKey));
    });
  });
}

function startBattle(io: SocketIOServer, roomKey: string, room: ActiveBattleRoom) {
  room.status = "active";
  room.startTime = Date.now();

  // Send first quiz
  if (room.quizzes.length > 0) {
    db.getQuizById(room.quizzes[0]).then(quiz => {
      io.to(roomKey as string).emit("battle:started", {
        quizId: quiz?.id,
        title: quiz?.title,
        type: quiz?.type,
        content: quiz?.content,
        totalQuizzes: room.quizzes.length,
      });
    });
  }
}

async function finishBattle(io: SocketIOServer, roomKey: string, room: ActiveBattleRoom) {
  room.status = "finished";

  // Save battle scores to database
  const participantArray = Array.from(room.participants.values());
  for (const participant of participantArray) {
    await db.updateBattleScore(
      room.roomId,
      participant.userId,
      participant.score,
      participant.correctCount,
      participant.participationPoints,
      participant.speedPoints
    );
  }

  // Update room status
  await db.updateBattleRoomStatus(room.roomId, "finished");

  // Send final results
  const resultsArray = Array.from(room.participants.values())
    .sort((a, b) => b.score - a.score);
  const results = resultsArray.map((p, idx) => ({
    rank: idx + 1,
    nickname: p.nickname,
    score: p.score,
    correctCount: p.correctCount,
  }));

  io.to(roomKey as string).emit("battle:finished", { results });

  // Clean up room after 5 minutes
  setTimeout(() => {
    activeRooms.delete(roomKey);
  }, 300000);
}
