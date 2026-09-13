import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { Loader2, BookOpen, Zap, Users, BarChart3, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClassMenu() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/class/:classId/menu");
  const classId = params?.classId ? parseInt(params.classId) : null;

  const classQuery = trpc.quizzes.list.useQuery(
    { classId: classId || 0 },
    { enabled: !!classId }
  );

  if (!classId) {
    return <div>Invalid class</div>;
  }

  if (classQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const menuItems = [
    {
      id: "quizzes",
      title: "クイズ一覧",
      description: "クラスのクイズを見る・作成する",
      icon: BookOpen,
      color: "bg-blue-100 dark:bg-blue-900",
      textColor: "text-blue-600 dark:text-blue-300",
      onClick: () => setLocation(`/class/${classId}/quizzes`),
    },
    {
      id: "battle",
      title: "リアルタイム対戦",
      description: "みんなと一緒にクイズで対戦",
      icon: Zap,
      color: "bg-purple-100 dark:bg-purple-900",
      textColor: "text-purple-600 dark:text-purple-300",
      onClick: () => setLocation(`/class/${classId}/battle`),
    },
    {
      id: "personal",
      title: "個人学習",
      description: "自分のペースで学習を進める",
      icon: Users,
      color: "bg-green-100 dark:bg-green-900",
      textColor: "text-green-600 dark:text-green-300",
      onClick: () => {
        sessionStorage.setItem("currentClassId", classId.toString());
        setLocation(`/personal-learning`);
      },
    },
    ...(user?.role === "admin" || user?.role === "teacher"
      ? [
          {
            id: "teacher",
            title: "教師ダッシュボード",
            description: "クラスの統計を確認",
            icon: BarChart3,
            color: "bg-orange-100 dark:bg-orange-900",
            textColor: "text-orange-600 dark:text-orange-300",
            onClick: () => setLocation(`/class/${classId}/teacher`),
          },
          {
            id: "code-manager",
            title: "クラスコード管理",
            description: "生徒参加用コードを管理",
            icon: Key,
            color: "bg-red-100 dark:bg-red-900",
            textColor: "text-red-600 dark:text-red-300",
            onClick: () => setLocation(`/class/${classId}/code-manager`),
          },
        ]
      : []),
  ];

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
          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              クラスメニュー
            </h2>
            <p className="text-muted-foreground">
              何をしたいですか？
            </p>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow rounded-xl overflow-hidden"
                  onClick={item.onClick}
                >
                  <CardHeader className={`${item.color} pb-3`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {item.description}
                        </CardDescription>
                      </div>
                      <Icon className={`w-8 h-8 ${item.textColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Button
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        item.onClick();
                      }}
                    >
                      開く
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Back Button */}
          <div className="pt-4">
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem("currentClassId");
                setLocation("/");
              }}
              className="rounded-lg"
            >
              クラス選択に戻る
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
