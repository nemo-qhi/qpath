import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Loader2, FileText, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function QuizFileSelector() {
  const { classId } = useParams<{ classId: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filesQuery = trpc.quizFiles.list.useQuery(
    { classId: parseInt(classId || "0") },
    { enabled: isAuthenticated && !!classId }
  );

  const createFileMutation = trpc.quizFiles.create.useMutation();
  const deleteFileMutation = trpc.quizFiles.delete.useMutation();

  if (!isAuthenticated) {
    return <div>ログインが必要です</div>;
  }

  const handleCreateFile = async () => {
    if (!fileName.trim()) {
      toast.error("ファイル名を入力してください");
      return;
    }

    setIsCreatingFile(true);
    try {
      await createFileMutation.mutateAsync({
        classId: parseInt(classId || "0"),
        name: fileName.trim(),
        description: fileDescription.trim() || undefined,
      });

      toast.success("ファイルを作成しました！");
      setFileName("");
      setFileDescription("");
      setIsDialogOpen(false);
      filesQuery.refetch();
    } catch (error) {
      console.error("File creation error:", error);
      const errorMessage = error instanceof Error ? error.message : "ファイルの作成に失敗しました";
      toast.error(errorMessage);
    } finally {
      setIsCreatingFile(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm("このファイルを削除しますか？")) return;

    try {
      await deleteFileMutation.mutateAsync({ fileId });
      toast.success("ファイルを削除しました！");
      filesQuery.refetch();
    } catch (error) {
      toast.error("ファイルの削除に失敗しました");
    }
  };

  const handleSelectFile = (fileId: number) => {
    sessionStorage.setItem("selectedQuizFileId", fileId.toString());
    setLocation(`/class/${classId}/create-quiz`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(`/class/${classId}/quizzes`)}
            className="rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">クイズファイル</h1>
            <p className="text-sm text-muted-foreground">クイズを整理するファイルを選択または作成</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Create File Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg h-12">
                <Plus className="w-4 h-4 mr-2" />
                新しいファイルを作成
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl">
              <DialogHeader>
                <DialogTitle>新しいファイルを作成</DialogTitle>
                <DialogDescription>
                  クイズを整理するための新しいファイルを作成します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-name" className="text-foreground mb-2 block">
                    ファイル名
                  </Label>
                  <Input
                    id="file-name"
                    placeholder="例：数学 - 代数"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="rounded-lg"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="file-description" className="text-foreground mb-2 block">
                    説明（オプション）
                  </Label>
                  <Textarea
                    id="file-description"
                    placeholder="このファイルについての説明"
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    className="rounded-lg"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsDialogOpen(false)}
                    variant="outline"
                    className="flex-1 rounded-lg"
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleCreateFile}
                    disabled={isCreatingFile}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                  >
                    {isCreatingFile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    作成
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Files List */}
          {filesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : filesQuery.data && filesQuery.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filesQuery.data.map((file) => (
                <Card
                  key={file.id}
                  className="rounded-xl border-border bg-card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSelectFile(file.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-accent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg truncate">{file.name}</CardTitle>
                          {file.description && (
                            <CardDescription className="text-xs md:text-sm line-clamp-2">
                              {file.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectFile(file.id);
                      }}
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                    >
                      このファイルでクイズを作成
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-xl border-border bg-card">
              <CardContent className="pt-6 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-semibold mb-2">ファイルがありません</p>
                <p className="text-sm text-muted-foreground">
                  新しいファイルを作成してクイズを整理しましょう
                </p>
              </CardContent>
            </Card>
          )}

          {/* Back Button */}
          <div>
            <Button
              variant="outline"
              onClick={() => setLocation(`/class/${classId}/quizzes`)}
              className="w-full rounded-lg"
            >
              クイズ一覧に戻る
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
