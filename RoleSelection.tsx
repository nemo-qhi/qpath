import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RoleSelection() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();

  const handleRoleSelection = async (role: "teacher" | "user") => {
    if (!user) return;
    setIsLoading(true);
    try {
      // ロールを更新
      await updateProfileMutation.mutateAsync({ role });

      if (role === "teacher") {
        // 先生用の選択画面へ
        setLocation("/teacher/choice");
      } else {
        // 生徒用のクラス参加画面へ
        setLocation("/student/join-class");
      }
    } catch (error) {
      toast.error("ロール設定に失敗しました");
      console.error("Failed to update role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">qpath</h1>
          <p className="text-lg text-muted-foreground">間違えて良いから始まる学び</p>
          <p className="text-sm text-muted-foreground mt-4">
            あなたのロールを選択してください
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 先生用 */}
          <Card className="rounded-xl border-border bg-card">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <BookOpen className="w-8 h-8 text-accent" />
                </div>
              </div>
              <CardTitle className="text-foreground">先生</CardTitle>
              <CardDescription className="text-muted-foreground">
                クラスを作成・管理し、クイズを配信
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  クラスコード発行
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  クイズ作成・管理
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  学生の進捗確認
                </li>
              </ul>
              <Button
                onClick={() => handleRoleSelection("teacher")}
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                先生として始める
              </Button>
            </CardContent>
          </Card>

          {/* 生徒用 */}
          <Card className="rounded-xl border-border bg-card">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Users className="w-8 h-8 text-accent" />
                </div>
              </div>
              <CardTitle className="text-foreground">生徒</CardTitle>
              <CardDescription className="text-muted-foreground">
                クラスに参加してクイズに挑戦
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  コードでクラス参加
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  クイズに挑戦
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  友達と対戦
                </li>
              </ul>
              <Button
                onClick={() => handleRoleSelection("user")}
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                生徒として始める
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
