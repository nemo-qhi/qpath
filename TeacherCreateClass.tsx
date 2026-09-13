import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy, Check, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function TeacherCreateClass() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [className, setClassName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdClass, setCreatedClass] = useState<{
    id: number;
    code: string;
    name: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const createClassMutation = trpc.classes.create.useMutation();

  // 先生ロール以外のユーザーはアクセス不可
  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) {
      setLocation("/");
      toast.error("先生ロールでアクセスしてください");
    }
  }, [user, loading, setLocation]);

  const handleCreateClass = async () => {
    if (!className.trim()) {
      toast.error("クラス名を入力してください");
      return;
    }

    setIsCreating(true);
    try {
      // 仮のコード生成（実装では schoolId が必要）
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      await createClassMutation.mutateAsync({
        schoolId: 1, // TODO: スクール選択機能を実装
        name: className,
        code: code,
        description: description || undefined,
      });

      setCreatedClass({
        id: 1, // TODO: 実際の ID を取得
        code: code,
        name: className,
      });

      toast.success("クラスを作成しました！");
    } catch (error) {
      toast.error("クラス作成に失敗しました");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (createdClass) {
      navigator.clipboard.writeText(createdClass.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success("コードをコピーしました");
    }
  };

  if (createdClass) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="container py-3 md:py-4 px-4 md:px-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">qpath</h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {user?.nickname || user?.name || "ユーザー"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-8 px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                クラスを作成しました！
              </h2>
              <p className="text-muted-foreground">
                以下のコードを生徒に共有してください
              </p>
            </div>

            <Card className="rounded-xl border-border bg-card mb-8">
              <CardHeader>
                <CardTitle className="text-foreground">{createdClass.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    招待コード
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-secondary/50 border border-border rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-foreground tracking-widest">
                        {createdClass.code}
                      </p>
                    </div>
                    <Button
                      onClick={handleCopyCode}
                      variant="outline"
                      className="rounded-lg"
                    >
                      {copiedCode ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                  <p className="text-sm text-foreground">
                    💡 このコードを生徒に共有すると、生徒がクラスに参加できます。
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setLocation("/")}
                    variant="outline"
                    className="flex-1 rounded-lg"
                  >
                    ホームに戻る
                  </Button>
                  <Button
                    onClick={() => setLocation(`/class/${createdClass.id}/code-manager`)}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                  >
                    コード管理
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ロール確認中はローディング表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // 先生ロール以外はアクセス不可
  if (!user || user.role !== "teacher") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-3 md:py-4 px-4 md:px-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">qpath</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {user?.nickname || user?.name || "ユーザー"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              新しいクラスを作成
            </h2>
            <p className="text-muted-foreground">
              クラス名と説明を入力してください
            </p>
          </div>

          <Card className="rounded-xl border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">クラス情報</CardTitle>
              <CardDescription className="text-muted-foreground">
                生徒に共有するクラスの基本情報を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="className" className="text-foreground">
                  クラス名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="className"
                  placeholder="例：数学 1年生"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">
                  説明
                </Label>
                <Textarea
                  id="description"
                  placeholder="クラスの説明を入力してください（オプション）"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-lg min-h-24"
                />
              </div>

              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  ℹ️ クラスを作成すると、自動的に招待コードが生成されます。
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setLocation("/")}
                  variant="outline"
                  className="flex-1 rounded-lg"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleCreateClass}
                  disabled={isCreating || !className.trim()}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  クラスを作成
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
