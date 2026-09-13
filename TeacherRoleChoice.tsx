import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogIn, Loader2, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function TeacherRoleChoice() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // 先生ロール以外のユーザーはアクセス不可
  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleCreateClass = () => {
    setLocation("/teacher/create-class");
  };

  const handleJoinClass = () => {
    setLocation("/teacher/join-class");
  };

  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation("/role-selection");
    } catch (error) {
      console.error("Logout failed:", error);
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

  // 先生ロール以外はアクセス不可
  if (!user || user.role !== "teacher") {
    return null;
  }

  if (logoutMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-3 md:py-4 px-4 md:px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">qpath</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {user?.nickname || user?.name || "先生"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="rounded-lg"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            ログアウト
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 px-4 md:px-6 max-w-2xl mx-auto">
        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              何をしますか？
            </h2>
            <p className="text-muted-foreground">
              新しいクラスを作成するか、既存のクラスに参加してください
            </p>
          </div>

          {/* Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Class */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all rounded-xl border-border bg-card hover:bg-card/80 hover:border-accent/50"
              onClick={handleCreateClass}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Plus className="w-8 h-8 text-accent" />
                  </div>
                </div>
                <CardTitle className="text-foreground">新しいクラスを作成</CardTitle>
                <CardDescription className="text-muted-foreground">
                  新しいクラスを作成してコードを発行
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                    クラス名を設定
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                    招待コードを自動生成
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                    生徒を招待
                  </li>
                </ul>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  クラスを作成
                </Button>
              </CardContent>
            </Card>

            {/* Join Class */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all rounded-xl border-border bg-card hover:bg-card/80 hover:border-accent/50"
              onClick={handleJoinClass}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <LogIn className="w-8 h-8 text-accent" />
                  </div>
                </div>
                <CardTitle className="text-foreground">既存のクラスに参加</CardTitle>
                <CardDescription className="text-muted-foreground">
                  コードを入力して既存のクラスに参加
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                    クラスコードを入力
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                    クラスに参加
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                    クイズを管理
                  </li>
                </ul>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
                  <LogIn className="w-4 h-4 mr-2" />
                  クラスに参加
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
