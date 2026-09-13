import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

function useParams<T extends Record<string, string | undefined>>() {
  const [match, params] = useRoute("/class/:classId/create-quiz");
  return (params || {}) as T;
}

export default function CreateQuiz() {
  const { classId } = useParams<{ classId: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState<"type" | "content" | "explanation" | "review">("type");
  const [quizType, setQuizType] = useState<"multiple_choice" | "fill_blank">("multiple_choice");
  const [question, setQuestion] = useState("");
  const [explanation, setExplanation] = useState("");

  // Multiple choice specific
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  // Fill in blank specific
  const [blankAnswer, setBlankAnswer] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createQuizMutation = trpc.quizzes.create.useMutation();

  if (!isAuthenticated) {
    return <div>ログインが必須です</div>;
  }

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  const handleNext = () => {
    const steps: ("type" | "content" | "explanation" | "review")[] = [
      "type",
      "content",
      "explanation",
      "review",
    ];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    const steps: ("type" | "content" | "explanation" | "review")[] = [
      "type",
      "content",
      "explanation",
      "review",
    ];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    // Validation
    const classIdNum = parseInt(classId || "0");
    if (!Number.isFinite(classIdNum) || classIdNum <= 0) {
      toast.error("クラスIDが無効です。ページをリロードしてください");
      console.error("Invalid classId:", classId, "parsed:", classIdNum);
      return;
    }

    if (!question.trim()) {
      toast.error("問題を入力してください");
      return;
    }
    if (!explanation.trim()) {
      toast.error("解説を入力してください（必須）");
      return;
    }

    if (quizType === "multiple_choice") {
      if (choices.some((c) => !c.trim())) {
        toast.error("全ての選択肢を入力してください");
        return;
      }
    } else {
      if (!blankAnswer.trim()) {
        toast.error("答えを入力してください");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const content = {
        question: question.trim(),
        ...(quizType === "multiple_choice"
          ? {
              choices: choices.map((c) => c.trim()),
              answer: choices[correctAnswer].trim(),
            }
          : {
              answer: blankAnswer.trim(),
            }),
      };

      await createQuizMutation.mutateAsync({
        classId: classIdNum,
        title: question.trim().substring(0, 100),
        type: quizType,
        content,
        explanation: explanation.trim(),
      });

      toast.success("クイズを作成しました！");
      setLocation(`/class/${classId}/quizzes`);
    } catch (error) {
      console.error("Failed to create quiz:", error);
      const errorMessage = (error as any)?.message || "クイズの作成に失敗しました";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case "type":
        return true;
      case "content":
        if (quizType === "multiple_choice") {
          return question.trim().length > 0 && choices.every((c) => c.trim().length > 0);
        } else {
          return question.trim().length > 0 && blankAnswer.trim().length > 0;
        }
      case "explanation":
        return explanation.trim().length > 0;
      case "review":
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(`/class/${classId}/quizzes`)}
            className="rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">
              新しいクイズを作成
            </h1>
            <p className="text-sm text-muted-foreground">
              {`ステップ ${["type", "content", "explanation", "review"].indexOf(step) + 1} / 4`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Step 1: Type */}
          {step === "type" && (
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">クイズの形式</CardTitle>
                <CardDescription>どのような形式のクイズにしますか？</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={quizType} onValueChange={(v) => setQuizType(v as any)}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-card/50 cursor-pointer">
                      <RadioGroupItem value="multiple_choice" id="multiple_choice" />
                      <Label htmlFor="multiple_choice" className="cursor-pointer flex-1">
                        <div className="font-semibold">4択形式</div>
                        <div className="text-sm text-muted-foreground">4つの選択肢から正解を選ぶ</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-card/50 cursor-pointer">
                      <RadioGroupItem value="fill_blank" id="fill_blank" />
                      <Label htmlFor="fill_blank" className="cursor-pointer flex-1">
                        <div className="font-semibold">穴埋め形式</div>
                        <div className="text-sm text-muted-foreground">自分で答えを入力する</div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Content */}
          {step === "content" && (
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  {quizType === "multiple_choice" ? "問題と選択肢" : "問題と答え"}
                </CardTitle>
                <CardDescription>クイズの内容を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="question" className="text-foreground mb-2 block">
                    問題
                  </Label>
                  <Textarea
                    id="question"
                    placeholder="例：日本の首都はどこですか？"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="rounded-lg"
                    rows={3}
                    autoFocus
                  />
                </div>

                {quizType === "multiple_choice" ? (
                  <div className="space-y-3">
                    <Label className="text-foreground">選択肢</Label>
                    {choices.map((choice, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct"
                          checked={correctAnswer === index}
                          onChange={() => setCorrectAnswer(index)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <Input
                          placeholder={`選択肢 ${index + 1}`}
                          value={choice}
                          onChange={(e) => handleChoiceChange(index, e.target.value)}
                          className="rounded-lg flex-1"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">ラジオボタンで正解を選択してください</p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="answer" className="text-foreground mb-2 block">
                      答え
                    </Label>
                    <Input
                      id="answer"
                      placeholder="例：東京"
                      value={blankAnswer}
                      onChange={(e) => setBlankAnswer(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Explanation */}
          {step === "explanation" && (
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">解説</CardTitle>
                <CardDescription>クイズの解説を入力してください</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="例：日本の首都は東京です。..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="rounded-lg"
                  rows={6}
                  autoFocus
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {step === "review" && (
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">確認</CardTitle>
                <CardDescription>クイズの内容を確認してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">問題</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{question}</p>
                </div>

                {quizType === "multiple_choice" ? (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">選択肢</h3>
                    <div className="space-y-2">
                      {choices.map((choice, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded-lg ${
                            index === correctAnswer
                              ? "bg-green-500/20 border border-green-500/50 text-green-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}. {choice} {index === correctAnswer && "✓ 正解"}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">答え</h3>
                    <p className="text-muted-foreground">{blankAnswer}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-foreground mb-2">解説</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{explanation}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {step !== "type" && (
              <Button
                onClick={handlePrev}
                variant="outline"
                className="flex-1 rounded-lg"
              >
                戻る
              </Button>
            )}
            {step !== "review" && (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
              >
                次へ
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {step === "review" && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                作成
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
