import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ChevronRight, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function PersonalLearning() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learningTime, setLearningTime] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [classId, setClassId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // クエリ
  const { data: cards, isLoading: cardsLoading, refetch: refetchCards } = trpc.personalLearning.getUserCards.useQuery({
    status: "learning",
  });
  const { data: stats } = trpc.personalLearning.getStats.useQuery();
  const { data: progressData } = trpc.personalLearning.getProgress.useQuery({ days: 30 });

  // ミューテーション
  const updateCardMutation = trpc.personalLearning.updateCardStatus.useMutation();
  const recordProgressMutation = trpc.personalLearning.recordProgress.useMutation();
  const submitAnswerMutation = trpc.answers.submit.useMutation();

  // クイズ詳細を取得
  const currentCard = cards?.[currentCardIndex];
  const quizQuery = trpc.quizzes.get.useQuery(
    { quizId: currentCard?.quizId || 0 },
    { enabled: !!currentCard?.quizId }
  );

  // 初期化：classId を取得
  useEffect(() => {
    const storedClassId = sessionStorage.getItem("currentClassId");
    setClassId(storedClassId);
  }, []);

  // 学習時間トラッキング
  useEffect(() => {
    const timer = setInterval(() => {
      setLearningTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // カード更新時にキャッシュを無効化
  useEffect(() => {
    if (currentCard?.quizId) {
      utils.quizzes.get.invalidate({ quizId: currentCard.quizId });
    }
  }, [currentCardIndex, utils]);

  if (!isAuthenticated) {
    return <div>ログインが必要です</div>;
  }

  const handleBackToClass = () => {
    if (classId) {
      setLocation(`/class/${classId}/menu`);
    } else {
      setLocation("/");
    }
  };

  if (cardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="container py-3 md:py-4 px-4 md:px-6 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToClass}
              className="rounded-lg flex-shrink-0"
            >
              <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
                個人学習モード
              </h1>
            </div>
          </div>
        </div>

        <div className="container py-8 px-4 md:px-6 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="rounded-xl border-border bg-card max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">学習するクイズがありません</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                クイズを作成または参加してから、個人学習モードで学習できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleBackToClass}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-xs md:text-sm"
              >
                クラスに戻る
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const masteredPercentage = stats ? (stats.masteredCount / (stats.masteredCount + stats.learningCount + stats.reviewingCount)) * 100 : 0;

  const handleMastered = async () => {
    if (!currentCard) return;
    try {
      await updateCardMutation.mutateAsync({
        cardId: currentCard.id,
        status: "mastered",
      });
      toast.success("習得しました！");
      setCurrentCardIndex((prev) => (prev + 1) % cards.length);
      setIsFlipped(false);
      setSelectedAnswer("");
      setShowExplanation(false);
      // キャッシュを無効化
      await utils.personalLearning.getUserCards.invalidate();
      await utils.personalLearning.getStats.invalidate();
    } catch (error) {
      toast.error("エラーが発生しました");
    }
  };

  const handleReview = async () => {
    if (!currentCard) return;
    try {
      await updateCardMutation.mutateAsync({
        cardId: currentCard.id,
        status: "reviewing",
      });
      toast.success("復習リストに追加しました");
      setCurrentCardIndex((prev) => (prev + 1) % cards.length);
      setIsFlipped(false);
      setSelectedAnswer("");
      setShowExplanation(false);
      // キャッシュを無効化
      await utils.personalLearning.getUserCards.invalidate();
      await utils.personalLearning.getStats.invalidate();
    } catch (error) {
      toast.error("エラーが発生しました");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      alert("回答を選択してください");
      return;
    }

    if (!currentCard) return;

    setIsSubmitting(true);
    try {
      await submitAnswerMutation.mutateAsync({
        quizId: currentCard.quizId,
        answer: selectedAnswer,
      });
      setShowExplanation(true);
    } catch (error) {
      toast.error("回答の送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const quiz = quizQuery.data;
  const content = quiz?.content as any;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-3 md:py-4 px-4 md:px-6 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToClass}
            className="rounded-lg flex-shrink-0"
          >
            <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
              個人学習モード
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              カードをスワイプして学習を進める
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4 md:py-8 px-4 md:px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
          <Card className="rounded-lg border-border bg-card">
            <CardContent className="pt-4 md:pt-6">
              <div className="text-xs md:text-sm text-muted-foreground">習得済み</div>
              <div className="text-xl md:text-3xl font-bold text-accent">{stats?.masteredCount || 0}</div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-border bg-card">
            <CardContent className="pt-4 md:pt-6">
              <div className="text-xs md:text-sm text-muted-foreground">学習中</div>
              <div className="text-xl md:text-3xl font-bold text-blue-400">{stats?.learningCount || 0}</div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-border bg-card">
            <CardContent className="pt-4 md:pt-6">
              <div className="text-xs md:text-sm text-muted-foreground">復習中</div>
              <div className="text-xl md:text-3xl font-bold text-purple-400">{stats?.reviewingCount || 0}</div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-border bg-card">
            <CardContent className="pt-4 md:pt-6">
              <div className="text-xs md:text-sm text-muted-foreground">学習時間</div>
              <div className="text-xl md:text-3xl font-bold text-green-400">
                {Math.floor(learningTime / 60)}m
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="rounded-lg border-border bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-sm md:text-base">習得進捗</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={masteredPercentage} className="h-2 md:h-3 rounded-full" />
            <p className="text-xs md:text-sm text-muted-foreground mt-2">
              {Math.round(masteredPercentage)}% 習得
            </p>
          </CardContent>
        </Card>

        {/* Quiz Content */}
        {quizQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : quiz ? (
          <div className="max-w-2xl mx-auto mb-6">
            {/* Quiz Title */}
            <Card className="rounded-xl border-border bg-card mb-6">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">{quiz.title}</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {quiz.type === "multiple_choice" ? "4択形式" : "穴埋め形式"}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Quiz Question */}
            <Card className="rounded-xl border-border bg-card mb-6">
              <CardHeader>
                <CardTitle className="text-lg">問題</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-lg mb-6">{content?.question}</p>

                {!showExplanation ? (
                  <>
                    {quiz.type === "multiple_choice" ? (
                      <div className="space-y-2 md:space-y-3">
                        <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                          {content?.choices?.map((choice: string, idx: number) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <RadioGroupItem value={choice} id={`choice-${idx}`} />
                              <Label htmlFor={`choice-${idx}`} className="cursor-pointer text-sm md:text-base">
                                {choice}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                        <Button
                          onClick={handleSubmitAnswer}
                          disabled={isSubmitting || !selectedAnswer}
                          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg mt-3 md:mt-4 text-sm md:text-base"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          回答する
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Input
                          placeholder="答えを入力"
                          value={selectedAnswer}
                          onChange={(e) => setSelectedAnswer(e.target.value)}
                          className="rounded-lg"
                        />
                        <Button
                          onClick={handleSubmitAnswer}
                          disabled={isSubmitting || !selectedAnswer}
                          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          回答する
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                      <p className="font-semibold text-foreground mb-2">解説</p>
                      <p className="text-foreground whitespace-pre-wrap">{quiz.explanation}</p>
                    </div>

                    <Button
                      onClick={() => {
                        setShowExplanation(false);
                        setSelectedAnswer("");
                      }}
                      variant="outline"
                      className="w-full rounded-lg"
                    >
                      もう一回
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3 md:gap-4 mb-8">
          <Button
            onClick={handleReview}
            disabled={updateCardMutation.isPending}
            variant="outline"
            className="rounded-lg text-xs md:text-sm h-10 md:h-12"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            もう一回
          </Button>
          <Button
            onClick={handleMastered}
            disabled={updateCardMutation.isPending}
            className="rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground text-xs md:text-sm h-10 md:h-12"
          >
            <ChevronRight className="w-4 h-4 mr-2" />
            わかった
          </Button>
        </div>

        {/* Learning Progress Chart */}
        {progressData && progressData.length > 0 && (
          <Card className="rounded-lg border-border bg-card mt-8">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">学習プログレス（過去30日）</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="masteredCount" stroke="#10b981" name="習得" />
                  <Line type="monotone" dataKey="reviewedCount" stroke="#8b5cf6" name="復習" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
