
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Loader2, MessageSquare, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useRoute } from "wouter";
import { useLocation } from "wouter";

// useParams を定義
function useParams<T extends Record<string, string | undefined>>() {
  const [match, params] = useRoute("/class/:classId/quizzes");
  return (params || {}) as T;
}

export default function ClassQuizzes() {
  const { classId } = useParams<{ classId: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [quizType, setQuizType] = useState<"multiple_choice" | "fill_blank">("multiple_choice");
  const [formData, setFormData] = useState({
    title: "",
    explanation: "",
    tags: "",
    question: "",
    choices: ["", "", "", ""],
    answer: "",
  });

  const quizzesQuery = trpc.quizzes.list.useQuery(
    { classId: parseInt(classId || "0") },
    { enabled: isAuthenticated && !!classId }
  );

  const createQuizMutation = trpc.quizzes.create.useMutation();

  if (!isAuthenticated) {
    return <div>ログインが必要です</div>;
  }

  const handleCreateQuiz = async () => {
    if (!formData.title || !formData.explanation) {
      alert("タイトルと解説は必須です");
      return;
    }

    setIsCreating(true);
    try {
      const content = quizType === "multiple_choice"
        ? {
            question: formData.question,
            choices: formData.choices.filter(c => c),
            answer: formData.answer,
          }
        : {
            question: formData.question,
            answer: formData.answer,
          };

      await createQuizMutation.mutateAsync({
        classId: parseInt(classId || "0"),
        title: formData.title,
        type: quizType,
        content,
        explanation: formData.explanation,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : undefined,
      });

      setFormData({
        title: "",
        explanation: "",
        tags: "",
        question: "",
        choices: ["", "", "", ""],
        answer: "",
      });

      quizzesQuery.refetch();
    } finally {
      setIsCreating(false);
    }
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
              onClick={() => {
                sessionStorage.removeItem("currentClassId");
                setLocation("/");
              }}
              className="rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">クイズ一覧</h1>
              <p className="text-sm text-muted-foreground">クラスのクイズを閲覧・作成</p>
            </div>
          </div>
          <Button
            onClick={() => setLocation(`/class/${classId}/create-quiz`)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            クイズ作成
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="hidden bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                クイズ作成
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-xl w-[95vw] md:w-full">
              <DialogHeader>
                <DialogTitle>クイズを作成</DialogTitle>
                <DialogDescription>
                  新しいクイズを作成して、クラスで共有しましょう
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="title">タイトル</Label>
                  <Input
                    id="title"
                    placeholder="例：世界の首都"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">クイズ形式</Label>
                  <Select value={quizType} onValueChange={(v: any) => setQuizType(v)}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">4択形式</SelectItem>
                      <SelectItem value="fill_blank">穴埋め形式</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question">問題文</Label>
                  <Textarea
                    id="question"
                    placeholder="問題を入力してください"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="rounded-lg"
                  />
                </div>

                {quizType === "multiple_choice" && (
                  <>
                    <div className="space-y-2">
                      <Label>選択肢</Label>
                      {formData.choices.map((choice, idx) => (
                        <Input
                          key={idx}
                          placeholder={`選択肢 ${idx + 1}`}
                          value={choice}
                          onChange={(e) => {
                            const newChoices = [...formData.choices];
                            newChoices[idx] = e.target.value;
                            setFormData({ ...formData, choices: newChoices });
                          }}
                          className="rounded-lg"
                        />
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="answer">正解</Label>
                      <Select value={formData.answer} onValueChange={(v) => setFormData({ ...formData, answer: v })}>
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder="正解を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.choices.map((choice, idx) => (
                            choice && (
                              <SelectItem key={idx} value={choice}>
                                {choice}
                              </SelectItem>
                            )
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {quizType === "fill_blank" && (
                  <div className="space-y-2">
                    <Label htmlFor="answer">正答</Label>
                    <Input
                      id="answer"
                      placeholder="正答を入力"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      className="rounded-lg"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="explanation">解説 *</Label>
                  <Textarea
                    id="explanation"
                    placeholder="解説を入力してください（必須）"
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">タグ（カンマ区切り）</Label>
                  <Input
                    id="tags"
                    placeholder="例：数学, 代数, 中学"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="rounded-lg"
                  />
                </div>

                <Button
                  onClick={handleCreateQuiz}
                  disabled={isCreating || !formData.title || !formData.explanation}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  作成
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {quizzesQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : quizzesQuery.data && quizzesQuery.data.length > 0 ? (
          <div className="grid gap-4">
            {quizzesQuery.data.map((quiz) => (
              <Card
                key={quiz.id}
                className="cursor-pointer hover:shadow-lg transition-shadow rounded-xl border-border bg-card hover:bg-card/80"
                onClick={() => setLocation(`/quiz/${quiz.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-foreground">{quiz.title}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {quiz.type === "multiple_choice" ? "4択形式" : "穴埋め形式"}
                      </CardDescription>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {quiz.answerCount}件の回答
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 items-center text-sm text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                    <span>コメント</span>
                    <Heart className="w-4 h-4 ml-4" />
                    <span>リアクション</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-xl border-border bg-card">
            <CardContent className="pt-8 text-center">
              <p className="text-muted-foreground mb-4">
                まだクイズがありません
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
                    最初のクイズを作成
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-xl w-[95vw] md:w-full">
                  <DialogHeader>
                    <DialogTitle>クイズを作成</DialogTitle>
                  </DialogHeader>
                  {/* Same form as above */}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
