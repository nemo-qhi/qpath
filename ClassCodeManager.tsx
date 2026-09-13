import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, RefreshCw, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function ClassCodeManager() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/class/:classId/code-manager");
  const classId = params?.classId ? parseInt(params.classId) : null;

  const [isGenerating, setIsGenerating] = useState(false);

  const classQuery = trpc.quizzes.list.useQuery(
    { classId: classId || 0 },
    { enabled: !!classId }
  );

  const codeQuery = trpc.classes.getCode.useQuery(
    { classId: classId || 0 },
    { enabled: !!classId }
  );

  const generateCodeMutation = trpc.classes.generateCode.useMutation();

  if (!classId) {
    return <div>Invalid class</div>;
  }

  if (classQuery.isLoading || codeQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const result = await generateCodeMutation.mutateAsync({ classId });
      toast.success(`新しいコードが生成されました: ${result.code}`);
      codeQuery.refetch();
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("コード生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    const code = typeof codeQuery.data?.code === 'string' ? codeQuery.data.code : codeQuery.data?.code?.code;
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success("コードをコピーしました");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-4 px-4 md:px-6 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">qpath</h1>
            <p className="text-sm text-muted-foreground">
              {user?.nickname || user?.name || "ユーザー"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/api/auth/logout")}
          >
            ログアウト
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 px-4 md:px-6">
        <div className="space-y-8">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => setLocation(`/class/${classId}/menu`)}
            className="rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              クラスコード管理
            </h2>
            <p className="text-muted-foreground">
              このコードを生徒に共有して、クラスに参加させます
            </p>
          </div>

          {/* Current Code Card */}
          <Card className="rounded-xl border-2 border-accent/30">
            <CardHeader>
              <CardTitle>現在のクラスコード</CardTitle>
              <CardDescription>
                生徒がクラスに参加するために必要なコード
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {codeQuery.data?.code ? (
                <>
                  <div className="space-y-4">
                    <div className="bg-secondary/50 rounded-lg p-6 text-center">
                      <p className="text-sm text-muted-foreground mb-2">コード</p>
                      <p className="text-4xl font-bold text-accent tracking-widest">
                        {typeof codeQuery.data.code === 'string' ? codeQuery.data.code : codeQuery.data.code?.code}
                      </p>
                    </div>
                    {typeof codeQuery.data.code === 'object' && codeQuery.data.code?.codeExpiresAt && (
                      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">有効期限</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(codeQuery.data.code.codeExpiresAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleCopyCode}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      コードをコピー
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 rounded-lg"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          新しいコード生成
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-xl">
                        <DialogHeader>
                          <DialogTitle>新しいコードを生成</DialogTitle>
                          <DialogDescription>
                            新しいコードを生成すると、古いコードは使用できなくなります。
                            本当に生成しますか？
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-lg"
                            onClick={() => {
                              // Close dialog
                              const closeButton = document.querySelector('[data-state="open"]');
                              if (closeButton) {
                                (closeButton as HTMLElement).click();
                              }
                            }}
                          >
                            キャンセル
                          </Button>
                          <Button
                            onClick={handleGenerateCode}
                            disabled={isGenerating}
                            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                生成中...
                              </>
                            ) : (
                              "生成する"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    コードがまだ生成されていません
                  </p>
                  <Button
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        コードを生成
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="rounded-xl bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                💡 使い方
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>
                1. 上のコードをコピーしてください
              </p>
              <p>
                2. 生徒に共有してください（メール、掲示板など）
              </p>
              <p>
                3. 生徒がqpathのホーム画面で「クラスに参加」を選び、
                このコードを入力すると参加できます
              </p>
              <p className="pt-2 border-t border-blue-300 dark:border-blue-700">
                ℹ️ コードを定期的に変更することで、セキュリティが向上します
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
