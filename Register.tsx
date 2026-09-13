import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function Register() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();

  if (loading) {
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
              まずはログインしてください
            </p>
            <a href="/api/oauth/login">
              <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl">
                ログイン
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If user already has a nickname, redirect to home
  if (user?.nickname) {
    setLocation("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error("ニックネームを入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim() || undefined,
        nickname: nickname.trim(),
        email: email.trim() || undefined,
      });
      toast.success("プロフィールを設定しました!");
      setLocation("/");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("プロフィール設定に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md rounded-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">プロフィール設定</CardTitle>
          <CardDescription>
            アカウント情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">本名（オプション）</Label>
              <Input
                id="name"
                placeholder="例：田中太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="rounded-lg"
              />
              <p className="text-xs text-muted-foreground">
                本名を入力すると、教師が生徒を識別しやすくなります
              </p>
            </div>

            {/* Nickname Field */}
            <div className="space-y-2">
              <Label htmlFor="nickname">ニックネーム（必須）</Label>
              <Input
                id="nickname"
                placeholder="例：太郎"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={isSubmitting}
                className="rounded-lg"
                required
              />
              <p className="text-xs text-muted-foreground">
                クラスで表示される名前です
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">メール（オプション）</Label>
              <Input
                id="email"
                type="email"
                placeholder="例：taro@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="rounded-lg"
              />
              <p className="text-xs text-muted-foreground">
                メール通知を受け取りたい場合は入力してください
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !nickname.trim()}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  設定中...
                </>
              ) : (
                "プロフィールを設定"
              )}
            </Button>

            {/* Info */}
            <div className="bg-secondary/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p>
                ℹ️ 後からプロフィールは変更できます
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
