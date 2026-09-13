import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function StudentJoinClass() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [classCode, setClassCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const joinClassMutation = trpc.classes.join.useMutation();

  // 生徒ロール以外のユーザーはアクセス不可
  useEffect(() => {
    if (!loading && (!user || user.role !== "user")) {
      setLocation("/");
      toast.error("生徒ロールでアクセスしてください");
    }
  }, [user, loading, setLocation]);

  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      toast.error("クラスコードを入力してください");
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinClassMutation.mutateAsync({ code: classCode });
      toast.success("クラスに参加しました！");
      // 参加後、クラスメニューへ遷移
      setLocation(`/class/${result.classId}/menu`);
    } catch (error) {
      toast.error("クラスコードが無効です");
      console.error("Failed to join class:", error);
    } finally {
      setIsJoining(false);
    }
  };

  // ロール確認中はローディング表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // 生徒ロール以外はアクセス不可
  if (!user || user.role !== "user") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-3 md:py-4 px-4 md:px-6 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">qpath</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {user?.nickname || user?.name || "ユーザー"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/";
              } catch (error) {
                console.error("Logout failed:", error);
              }
            }}
            className="ml-2 text-xs md:text-sm"
          >
            ログアウト
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 px-4 md:px-6 max-w-md mx-auto">
        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              クラスに参加
            </h2>
            <p className="text-muted-foreground">
              先生から受け取ったコードを入力してクラスに参加しましょう
            </p>
          </div>

          {/* Join Class Card */}
          <Card className="rounded-xl border-2 border-accent/30">
            <CardHeader>
              <CardTitle>クラスコード入力</CardTitle>
              <CardDescription>
                先生から共有されたコードを入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="classCode" className="text-foreground">
                  クラスコード
                </Label>
                <Input
                  id="classCode"
                  placeholder="例: ABC123"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-2xl font-bold tracking-widest rounded-lg"
                  disabled={isJoining}
                />
              </div>

              <Button
                onClick={handleJoinClass}
                disabled={isJoining || !classCode.trim()}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    参加中...
                  </>
                ) : (
                  "クラスに参加"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="rounded-xl bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                💡 コードについて
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>
                クラスコードは先生から共有されます
              </p>
              <p>
                コードを入力するとクラスに参加でき、クイズに挑戦できるようになります
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
