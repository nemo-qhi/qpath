import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, MessageSquare, Heart, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

type ReactionType = "great" | "difficult" | "interesting";

export default function QuizDetail() {
  const { quizId } = useParams<{ quizId: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  const quizQuery = trpc.quizzes.get.useQuery(
    { quizId: parseInt(quizId || "0") },
    { enabled: isAuthenticated && !!quizId }
  );

  const myAnswerQuery = trpc.answers.getMyAnswer.useQuery(
    { quizId: parseInt(quizId || "0") },
    { enabled: isAuthenticated && !!quizId }
  );

  const commentsQuery = trpc.comments.list.useQuery(
    { quizId: parseInt(quizId || "0") },
    { enabled: isAuthenticated && !!quizId }
  );

  const reactionsQuery = trpc.reactions.list.useQuery(
    { quizId: parseInt(quizId || "0") },
    { enabled: isAuthenticated && !!quizId }
  );

  const submitAnswerMutation = trpc.answers.submit.useMutation();
  const createCommentMutation = trpc.comments.create.useMutation();
  const addReactionMutation = trpc.reactions.add.useMutation();

  if (!isAuthenticated) {
    return <div>ログインが必要です</div>;
  }

  if (quizQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!quizQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="rounded-xl border-border bg-card">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground mb-4">クイズが見つかりません</p>
            <Button onClick={() => setLocation("/")} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
              ホームに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quiz = quizQuery.data;
  const content = quiz.content as any;
  const myAnswer = myAnswerQuery.data;
  const isAnswered = !!myAnswer;

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      alert("回答を選択してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitAnswerMutation.mutateAsync({
        quizId: parseInt(quizId || "0"),
        answer: selectedAnswer,
      });

      setShowExplanation(true);
      myAnswerQuery.refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setIsCommentSubmitting(true);
    try {
      await createCommentMutation.mutateAsync({
        quizId: parseInt(quizId || "0"),
        content: commentText,
      });

      setCommentText("");
      commentsQuery.refetch();
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleAddReaction = async (type: ReactionType) => {
    try {
      await addReactionMutation.mutateAsync({
        quizId: parseInt(quizId || "0"),
        type,
      });

      reactionsQuery.refetch();
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const reactionCounts = {
    great: reactionsQuery.data?.filter(r => r.type === "great").length || 0,
    difficult: reactionsQuery.data?.filter(r => r.type === "difficult").length || 0,
    interesting: reactionsQuery.data?.filter(r => r.type === "interesting").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container px-4 md:px-6 py-4 flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="rounded-lg flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">{quiz.title}</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {quiz.type === "multiple_choice" ? "4択形式" : "穴埋め形式"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 md:px-6 py-6 md:py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Quiz Question */}
          <Card className="rounded-xl border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">問題</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-lg mb-6">{content.question}</p>

              {!isAnswered ? (
                <>
                  {quiz.type === "multiple_choice" ? (
                    <div className="space-y-2 md:space-y-3">
                      <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                        {content.choices?.map((choice: string, idx: number) => (
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
                  <div className={`p-4 rounded-lg ${myAnswer.isCorrect ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"}`}>
                    <p className={`font-semibold ${myAnswer.isCorrect ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"}`}>
                      {myAnswer.isCorrect ? "✓ 正解です！" : "おしい！"}
                    </p>
                  </div>

                  {showExplanation && (
                    <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                      <p className="font-semibold text-foreground mb-2">解説</p>
                      <p className="text-foreground whitespace-pre-wrap">{quiz.explanation}</p>
                    </div>
                  )}

                  <Button
                    onClick={() => setShowExplanation(!showExplanation)}
                    variant="outline"
                    className="w-full rounded-lg"
                  >
                    {showExplanation ? "解説を隠す" : "解説を見る"}
                  </Button>

                  <Button
                    onClick={() => {
                      setSelectedAnswer("");
                      setShowExplanation(false);
                    }}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                  >
                    もう一回
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reactions */}
          <Card className="rounded-xl border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm">リアクション</CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddReaction("great")}
                  className="rounded-lg text-xs md:text-sm flex-1 min-w-fit"
                >
                  <Heart className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  <span className="hidden sm:inline">なるほど</span>
                  <span className="sm:hidden">OK</span> ({reactionCounts.great})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddReaction("difficult")}
                  className="rounded-lg text-xs md:text-sm flex-1 min-w-fit"
                >
                  難 ({reactionCounts.difficult})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddReaction("interesting")}
                  className="rounded-lg text-xs md:text-sm flex-1 min-w-fit"
                >
                  面白 ({reactionCounts.interesting})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="rounded-xl border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm">コメント</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="コメントを入力..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="rounded-lg"
                  rows={2}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={isCommentSubmitting || !commentText.trim()}
                  size="icon"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                >
                  {isCommentSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                {commentsQuery.data?.map((comment) => (
                  <div key={comment.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      ユーザー • {new Date(comment.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                    <p className="text-foreground">{comment.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
