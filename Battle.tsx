import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Zap, Loader2, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface BattleParticipant {
  nickname: string;
  score: number;
  correctCount: number;
}

interface BattleResult {
  rank: number;
  nickname: string;
  score: number;
  correctCount: number;
}

export default function Battle() {
  const { classId } = useParams<{ classId: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [battleState, setBattleState] = useState<"idle" | "joining" | "waiting" | "active" | "finished">("idle");
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [results, setResults] = useState<BattleResult[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const createRoomMutation = trpc.battles.createRoom.useMutation();

  if (!isAuthenticated) {
    return <div>ログインが必要です</div>;
  }

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      // Generate random room code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      await createRoomMutation.mutateAsync({
        classId: parseInt(classId || "0"),
        code,
      });

      setRoomCode(code);
      joinBattleRoom(code);
    } finally {
      setIsCreating(false);
    }
  };

  const joinBattleRoom = (code: string) => {
    setIsJoining(true);
    setBattleState("joining");

    // Initialize Socket.io connection
    const newSocket = io(window.location.origin, {
      path: "/socket.io",
      reconnection: true,
    });

    newSocket.on("connect", () => {
      console.log("Connected to battle server");

      newSocket.emit("battle:join", {
        code,
        userId: user?.id,
        nickname: user?.nickname || user?.name || "Anonymous",
      });
    });

    newSocket.on("battle:joined", (data: any) => {
      console.log("Joined battle room:", data);
      setRoomCode(data.roomCode);
      setBattleState("waiting");
      setIsJoining(false);
    });

    newSocket.on("battle:participants-updated", (data: any) => {
      setParticipants(data.participants);
    });

    newSocket.on("battle:started", (data: any) => {
      console.log("Battle started:", data);
      setBattleState("active");
      setCurrentQuiz(data);
      setSelectedAnswer("");
    });

    newSocket.on("battle:next-quiz", (data: any) => {
      setCurrentQuiz(data);
      setSelectedAnswer("");
    });

    newSocket.on("battle:answer-result", (data: any) => {
      console.log("Answer result:", data);
      // Update participant scores
      setParticipants(prev =>
        prev.map(p =>
          p.nickname === data.nickname
            ? { ...p, score: data.totalScore }
            : p
        )
      );
    });

    newSocket.on("battle:finished", (data: any) => {
      console.log("Battle finished:", data);
      setBattleState("finished");
      setResults(data.results);
    });

    newSocket.on("battle:error", (data: any) => {
      console.error("Battle error:", data);
      alert(data.message);
      setIsJoining(false);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from battle server");
    });

    setSocket(newSocket);
  };

  const handleSubmitAnswer = () => {
    if (!socket || !selectedAnswer) return;

    const startTime = Date.now();
    socket.emit("battle:answer", {
      answer: selectedAnswer,
      timeSpent: startTime - (currentQuiz?.startTime || startTime),
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Zap className="w-6 h-6 text-accent" />
                リアルタイム対戦
              </h1>
              <p className="text-sm text-muted-foreground">クラスの仲間と競い合おう</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 max-w-4xl">
        {battleState === "idle" && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Create Room */}
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle>新しいルームを作成</CardTitle>
                <CardDescription>対戦ルームを作成して、招待コードを共有</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  ルームを作成
                </Button>
              </CardContent>
            </Card>

            {/* Join Room */}
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle>ルームに参加</CardTitle>
                <CardDescription>招待コードを入力して参加</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="招待コード"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="rounded-lg"
                />
                <Button
                  onClick={() => joinBattleRoom(roomCode)}
                  disabled={isJoining || !roomCode}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  参加
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {battleState === "waiting" && (
          <div className="space-y-6">
            {/* Room Info */}
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle>対戦ルーム</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">招待コード</p>
                    <p className="text-2xl font-bold text-foreground">{roomCode}</p>
                  </div>
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copiedCode ? "コピーしました" : "コピー"}
                  </Button>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">参加者（{participants.length}人）</p>
                  <div className="space-y-2">
                    {participants.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <p className="text-foreground">{p.nickname}</p>
                        <p className="text-sm text-muted-foreground">{p.score}pt</p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  対戦は参加者が揃ったら自動で開始します...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {battleState === "active" && currentQuiz && (
          <div className="space-y-6">
            {/* Participants Leaderboard */}
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm">スコアボード</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {participants
                    .sort((a, b) => b.score - a.score)
                    .map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-accent">#{idx + 1}</span>
                          <p className="text-foreground">{p.nickname}</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{p.score}pt</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Quiz */}
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle>{currentQuiz.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg text-foreground">{currentQuiz.content?.question}</p>

                {currentQuiz.type === "multiple_choice" ? (
                  <div className="space-y-2">
                    {currentQuiz.content?.choices?.map((choice: string, idx: number) => (
                      <Button
                        key={idx}
                        onClick={() => setSelectedAnswer(choice)}
                        variant={selectedAnswer === choice ? "default" : "outline"}
                        className={`w-full justify-start rounded-lg ${
                          selectedAnswer === choice
                            ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                            : ""
                        }`}
                      >
                        {choice}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Input
                    placeholder="答えを入力"
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="rounded-lg"
                  />
                )}

                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                >
                  回答する
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {battleState === "finished" && (
          <div className="space-y-6">
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle>対戦終了</CardTitle>
                <CardDescription>最終結果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.map((result) => (
                    <div
                      key={result.rank}
                      className={`p-4 rounded-lg flex items-center justify-between ${
                        result.rank === 1
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                          : "bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-foreground">#{result.rank}</span>
                        <div>
                          <p className="font-semibold text-foreground">{result.nickname}</p>
                          <p className="text-sm text-muted-foreground">{result.correctCount}問正解</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-accent">{result.score}pt</p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => {
                    setBattleState("idle");
                    setRoomCode("");
                    setParticipants([]);
                    setResults([]);
                    if (socket) socket.disconnect();
                  }}
                  className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                >
                  ホームに戻る
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
