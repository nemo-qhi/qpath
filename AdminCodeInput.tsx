import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminCodeInput() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const useCodeMutation = trpc.adminCodes.useCode.useMutation();

  if (!isAuthenticated) {
    return <div>ログインが必要です</div>;
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("コードを入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      await useCodeMutation.mutateAsync({ code: code.trim() });
      toast.success("管理者コードが有効化されました！");
      setCode("");
      // 管理ページへリダイレクト
      setTimeout(() => setLocation("/admin"), 1000);
    } catch (error: any) {
      toast.error(error?.message || "無効なコードです");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-3 md:py-4 px-4 md:px-6 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="rounded-lg flex-shrink-0"
          >
            <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
              管理者コード入力
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              管理者になるためのコードを入力
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4 md:py-8 px-4 md:px-6">
        <div className="max-w-md mx-auto">
          <Card className="rounded-xl border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">管理者コードを入力</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                管理者から受け取ったコードを入力して、管理者権限を有効化します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-xs md:text-sm">
                  管理者コード
                </Label>
                <Input
                  id="code"
                  placeholder="例: ABC123DEF456GHI789"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="rounded-lg text-xs md:text-sm"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !code.trim()}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-xs md:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2 animate-spin" />
                    処理中...
                  </>
                ) : (
                  "コードを確認"
                )}
              </Button>

              <div className="text-xs md:text-sm text-muted-foreground space-y-2 pt-4 border-t border-border">
                <p>
                  <strong>現在のロール:</strong> {user?.role === "admin" ? "管理者" : "一般ユーザー"}
                </p>
                {user?.role !== "admin" && (
                  <p className="text-xs">
                    コードを入力すると、管理者権限を得られます。
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
