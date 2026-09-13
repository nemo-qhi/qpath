import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, BarChart3, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

export default function TeacherDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/class/:classId/teacher");
  const classId = params?.classId ? parseInt(params.classId) : null;
  const [searchStudent, setSearchStudent] = useState("");

  // クエリ
  const { data: classMembers, isLoading: membersLoading } = trpc.classes.getMembers.useQuery(
    { classId: classId || 0 },
    { enabled: !!classId }
  );
  const { data: quizzes, isLoading: quizzesLoading } = trpc.quizzes.list.useQuery(
    { classId: classId || 0 }
  );
  const classLoading = membersLoading || quizzesLoading;

  if (!isAuthenticated) {
    return <div>ログインが必要です</div>;
  }

  if (!classId) {
    return <div>クラスが見つかりません</div>;
  }

  if (classLoading || membersLoading || quizzesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // 統計計算
  const totalAnswers = quizzes?.reduce((sum: number, q: any) => sum + (q.answerCount || 0), 0) || 0;
  const totalCorrect = quizzes?.reduce((sum: number, q: any) => sum + (q.correctCount || 0), 0) || 0;
  const correctRate = totalAnswers > 0 ? ((totalCorrect / totalAnswers) * 100).toFixed(1) : 0;

  // 生徒フィルタ
  const filteredMembers = classMembers?.filter((member: any) =>
    (member as any).name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    (member as any).nickname?.toLowerCase().includes(searchStudent.toLowerCase())
  ) || [];

  // クイズ別の正答率データ
  const quizChartData = quizzes?.map((q: any) => ({
    name: q.title?.substring(0, 10) || "Quiz",
    correctRate: q.answerCount ? ((q.correctCount || 0) / q.answerCount * 100).toFixed(1) : 0,
    answerCount: q.answerCount || 0,
  })) || [];

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
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
              教師ダッシュボード
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              教師ダッシュボード
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4 md:py-8 px-4 md:px-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
          <Card className="rounded-lg border-border bg-card">
            <CardContent className="pt-4 md:pt-6">
              <div className="text-xs md:text-sm text-muted-foreground">生徒数</div>
              <div className="text-xl md:text-3xl font-bold text-accent">
                {classMembers?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-border bg-card">
            <CardContent className="pt-4 md:pt-6">
              <div className="text-xs md:text-sm text-muted-foreground">クイズ数</div>
              <div className="text-xl md:text-3xl font-bold text-blue-400">
                {quizzes?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-border bg-card">
            <CardContent className="pt-4 md:pt-6">
              <div className="text-xs md:text-sm text-muted-foreground">回答数</div>
              <div className="text-xl md:text-3xl font-bold text-purple-400">
                {totalAnswers}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-border bg-card">
            <CardContent className="pt-4 md:pt-6">
              <div className="text-xs md:text-sm text-muted-foreground">正答率</div>
              <div className="text-xl md:text-3xl font-bold text-green-400">
                {correctRate}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Quiz Performance Chart */}
          <Card className="rounded-lg border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                クイズ別正答率
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quizChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quizChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="correctRate" fill="#8b5cf6" name="正答率 %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  データがありません
                </div>
              )}
            </CardContent>
          </Card>

          {/* Answer Count Chart */}
          <Card className="rounded-lg border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">回答数推移</CardTitle>
            </CardHeader>
            <CardContent>
              {quizChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={quizChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="answerCount" stroke="#10b981" name="回答数" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  データがありません
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Student List */}
        <Card className="rounded-lg border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              生徒一覧
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              クラスに参加している生徒の一覧です
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="生徒名またはニックネームで検索..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="rounded-lg text-xs md:text-sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-semibold text-muted-foreground">
                      名前
                    </th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-semibold text-muted-foreground">
                      ニックネーム
                    </th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-semibold text-muted-foreground">
                      参加日
                    </th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-semibold text-muted-foreground">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member: any) => (
                      <tr key={member.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          {member.name || "N/A"}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          {member.nickname || "-"}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          {new Date(member.createdAt).toLocaleDateString("ja-JP")}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs h-8 md:h-9"
                          >
                            詳細
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        生徒が見つかりません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
