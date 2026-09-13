import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, BookOpen, Zap, Plus } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const classesQuery = trpc.classes.list.useQuery(undefined, { enabled: isAuthenticated });
  const joinClassMutation = trpc.classes.join.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  // ニックネームが設定されていない場合はロール選択画面へ遷移
  useEffect(() => {
    if (isAuthenticated && user && !user.nickname) {
      setLocation("/role-selection");
    }
  }, [isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // ロール選択画面への遷移中の場合はローディング表示
  if (isAuthenticated && user && !user.nickname) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">qpath</h1>
            <p className="text-lg text-muted-foreground">間違えて良いから始まる学び</p>
          </div>

          <div className="space-y-4 pt-8">
            <p className="text-muted-foreground">
              クイズを作成・共有して、みんなで学ぼう。
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl">
                ログイン
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
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
          <Button variant="outline" size="sm" onClick={async () => {
            try {
              await logoutMutation.mutateAsync();
              window.location.href = "/";
            } catch (error) {
              console.error("Logout failed:", error);
            }
          }} className="ml-2 text-xs md:text-sm">
            ログアウト
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4 md:py-8 px-4 md:px-6">
        <div className="space-y-8">
          {/* Classes Section */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">クラス</h2>
                <p className="text-xs md:text-sm text-muted-foreground">所属しているクラスを選択してください</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    クラスに参加
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl">
                  <DialogHeader>
                    <DialogTitle>クラスに参加</DialogTitle>
                    <DialogDescription>
                      招待コードを入力してクラスに参加します
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">招待コード</Label>
                      <Input
                        id="code"
                        placeholder="例: ABC123"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <Button
                      onClick={async () => {
                        setIsJoining(true);
                        try {
                          await joinClassMutation.mutateAsync({ code: joinCode });
                          setJoinCode("");
                          classesQuery.refetch();
                        } finally {
                          setIsJoining(false);
                        }
                      }}
                      disabled={isJoining || !joinCode}
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                    >
                      {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      参加
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {classesQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : classesQuery.data && classesQuery.data.length > 0 ? (
              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {classesQuery.data.map((cls) => (
                  <Card
                    key={cls.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow rounded-xl border-border bg-card hover:bg-card/80"
                    onClick={() => setLocation(`/class/${cls.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base md:text-lg text-foreground truncate">{cls.name}</CardTitle>
                      <CardDescription className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                        {cls.description || "説明なし"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-col md:flex-row">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-lg text-xs md:text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/class/${cls.id}/quizzes`);
                          }}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          クイズ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-lg text-xs md:text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/class/${cls.id}/battle`);
                          }}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          対戦
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-xl border-border bg-card">
                <CardContent className="pt-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    まだクラスに参加していません
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
                        クラスに参加する
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-xl">
                      <DialogHeader>
                        <DialogTitle>クラスに参加</DialogTitle>
                        <DialogDescription>
                          招待コードを入力してクラスに参加します
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="code2">招待コード</Label>
                          <Input
                            id="code2"
                            placeholder="例: ABC123"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            className="rounded-lg"
                          />
                        </div>
                        <Button
                          onClick={async () => {
                            setIsJoining(true);
                            try {
                              await joinClassMutation.mutateAsync({ code: joinCode });
                              setJoinCode("");
                              classesQuery.refetch();
                            } finally {
                              setIsJoining(false);
                            }
                          }}
                          disabled={isJoining || !joinCode}
                          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                        >
                          {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          参加
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
