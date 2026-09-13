import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, BookOpen, Zap, BarChart3, AlertCircle, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalQuizzes: number;
  totalAnswers: number;
  totalBattleRooms: number;
  averageAccuracy: number;
}

interface UserData {
  id: number;
  name: string | null;
  email: string | null;
  nickname: string | null;
  role: string;
  createdAt: Date;
}

interface QuizData {
  id: number;
  title: string;
  type: string;
  answerCount: number;
  correctCount: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchQuiz, setSearchQuiz] = useState("");

  const statsQuery = trpc.admin.getStats.useQuery();
  const usersQuery = trpc.admin.getUsers.useQuery();
  const quizzesQuery = trpc.admin.getQuizzes.useQuery();

  useEffect(() => {
    if (statsQuery.data) setStats(statsQuery.data);
    if (usersQuery.data) setUsers(usersQuery.data);
    if (quizzesQuery.data) setQuizzes(quizzesQuery.data);
  }, [statsQuery.data, usersQuery.data, quizzesQuery.data]);

  if (!isAuthenticated) {
    return <div>ログインが必要です</div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="rounded-xl border-border bg-card max-w-md">
          <CardContent className="pt-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-foreground font-semibold mb-2">アクセス権限がありません</p>
            <p className="text-muted-foreground text-sm mb-4">このページは管理者のみアクセス可能です</p>
            <Button onClick={() => setLocation("/")} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
              ホームに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    (u.name?.toLowerCase().includes(searchUser.toLowerCase()) || false) ||
    (u.email?.toLowerCase().includes(searchUser.toLowerCase()) || false)
  );

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchQuiz.toLowerCase())
  );

  // Mock data for charts
  const chartData = [
    { date: "1/1", users: 120, quizzes: 45, answers: 320 },
    { date: "1/2", users: 135, quizzes: 52, answers: 380 },
    { date: "1/3", users: 150, quizzes: 58, answers: 420 },
    { date: "1/4", users: 165, quizzes: 65, answers: 480 },
    { date: "1/5", users: 180, quizzes: 72, answers: 540 },
    { date: "1/6", users: 195, quizzes: 80, answers: 600 },
    { date: "1/7", users: 210, quizzes: 88, answers: 680 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">開発者向け管理ページ</h1>
            <p className="text-sm text-muted-foreground">システム統計・ユーザー管理</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name} (管理者)</span>
            <Button
              onClick={() => {
                logout();
                setLocation("/");
              }}
              variant="outline"
              size="sm"
              className="rounded-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="rounded-xl border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                ユーザー数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stats?.totalUsers || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                アクティブ: {stats?.activeUsers || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                クイズ数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stats?.totalQuizzes || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                回答数: {stats?.totalAnswers || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                対戦ルーム
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stats?.totalBattleRooms || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                平均正答率: {stats?.averageAccuracy.toFixed(1) || 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Card className="rounded-xl border-border bg-card mb-8">
          <CardHeader>
            <CardTitle>7日間の推移</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#a78bfa" name="ユーザー" />
                <Line type="monotone" dataKey="quizzes" stroke="#60a5fa" name="クイズ" />
                <Line type="monotone" dataKey="answers" stroke="#34d399" name="回答" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="rounded-lg">
            <TabsTrigger value="users" className="rounded-lg">ユーザー管理</TabsTrigger>
            <TabsTrigger value="quizzes" className="rounded-lg">クイズ管理</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-lg">ログ</TabsTrigger>
          <TabsTrigger value="codes" className="rounded-lg">管理者コード</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle>ユーザー一覧</CardTitle>
                <CardDescription>全ユーザーの管理</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="ユーザー名またはメールで検索..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="rounded-lg"
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left py-2 px-4 text-muted-foreground">名前</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">メール</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">ニックネーム</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">ロール</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">作成日</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-4 text-foreground">{u.name || '-'}</td>
                          <td className="py-2 px-4 text-muted-foreground">{u.email || '-'}</td>
                          <td className="py-2 px-4 text-foreground">{u.nickname || '-'}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              u.role === "admin"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            }`}>
                              {u.role === "admin" ? "管理者" : "ユーザー"}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-muted-foreground">
                            {u.createdAt instanceof Date ? u.createdAt.toLocaleDateString("ja-JP") : new Date(u.createdAt).toLocaleDateString("ja-JP")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes">
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle>クイズ一覧</CardTitle>
                <CardDescription>全クイズの管理</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="クイズタイトルで検索..."
                  value={searchQuiz}
                  onChange={(e) => setSearchQuiz(e.target.value)}
                  className="rounded-lg"
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left py-2 px-4 text-muted-foreground">タイトル</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">形式</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">回答数</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">正答数</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">正答率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuizzes.map((q) => (
                        <tr key={q.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-4 text-foreground">{q.title}</td>
                          <td className="py-2 px-4 text-muted-foreground">
                            {q.type === "multiple_choice" ? "4択" : "穴埋め"}
                          </td>
                          <td className="py-2 px-4 text-foreground">{q.answerCount}</td>
                          <td className="py-2 px-4 text-foreground">{q.correctCount}</td>
                          <td className="py-2 px-4 text-foreground">
                            {q.answerCount > 0 ? ((q.correctCount / q.answerCount) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Codes Tab */}
          <TabsContent value="codes">
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle>管理者コード管理</CardTitle>
                <CardDescription>管理者権限を付与するためのコードを生成・管理</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
                  新しいコードを生成
                </Button>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left py-2 px-4 text-muted-foreground">コード</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">生成日</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">有効期限</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">使用者</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">ステータス</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">アクション</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-4 text-foreground font-mono">ABC123XYZ</td>
                        <td className="py-2 px-4 text-muted-foreground">2026-01-10</td>
                        <td className="py-2 px-4 text-muted-foreground">2026-02-10</td>
                        <td className="py-2 px-4 text-muted-foreground">未使用</td>
                        <td className="py-2 px-4">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            有効
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <Button variant="outline" size="sm" className="rounded-lg text-xs">
                            無効化
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-4 text-foreground font-mono">DEF456UVW</td>
                        <td className="py-2 px-4 text-muted-foreground">2026-01-05</td>
                        <td className="py-2 px-4 text-muted-foreground">2026-02-05</td>
                        <td className="py-2 px-4 text-foreground">琀凍</td>
                        <td className="py-2 px-4">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            使用済み
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <Button variant="outline" size="sm" className="rounded-lg text-xs" disabled>
                            無効化
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card className="rounded-xl border-border bg-card">
              <CardHeader>
                <CardTitle>システムログ</CardTitle>
                <CardDescription>最近のアクティビティ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-3 bg-muted/30 rounded-lg text-sm">
                    <p className="text-muted-foreground">2026-01-15 10:30 - ユーザー「太郎」がクイズを作成</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-sm">
                    <p className="text-muted-foreground">2026-01-15 10:25 - ユーザー「花子」が対戦ルームを作成</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-sm">
                    <p className="text-muted-foreground">2026-01-15 10:20 - ユーザー「次郎」がクラスに参加</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-sm">
                    <p className="text-muted-foreground">2026-01-15 10:15 - 新規ユーザー登録</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
