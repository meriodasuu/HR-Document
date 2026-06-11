import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetDocuments, useDeleteDocument } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Files, 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Trash2,
  FileText
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getRole } from "@/lib/auth";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm">Черновик</Badge>;
    case 'pending_signature':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 shadow-sm">На подписи</Badge>;
    case 'signed':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shadow-sm">Подписан</Badge>;
    case 'printed':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm">Напечатан</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function Documents() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: documents, isLoading } = useGetDocuments();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const role = getRole();

  const deleteMutation = useDeleteDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        toast({ title: "Успешно", description: "Документ удален" });
      },
      onError: (err) => toast({ title: "Ошибка", description: err.message, variant: "destructive" })
    }
  });

  const filteredDocs = documents?.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) || 
                          doc.employeeName.toLowerCase().includes(search.toLowerCase()) ||
                          doc.number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center">
              <Files className="w-8 h-8 mr-3 text-primary" />
              Реестр документов
            </h1>
            <p className="text-muted-foreground mt-1">Архив приказов, договоров и актов</p>
          </div>
          
          {role === "hr" && (
            <Button asChild className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover-elevate">
              <Link href="/documents/new">
                <Plus className="w-4 h-4 mr-2" />
                Создать документ
              </Link>
            </Button>
          )}
        </div>

        <Card className="border border-border/50 shadow-sm bg-card/80 backdrop-blur-sm">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 bg-secondary/10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Поиск по номеру, названию или ФИО..." 
                className="pl-9 bg-background border-border/50 focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 min-w-[200px]">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="draft">Черновики</SelectItem>
                  <SelectItem value="pending_signature">На подписи</SelectItem>
                  <SelectItem value="signed">Подписанные</SelectItem>
                  <SelectItem value="printed">Напечатанные</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                <tr>
                  <th className="px-6 py-4 font-semibold">Документ</th>
                  <th className="px-6 py-4 font-semibold">Сотрудник</th>
                  <th className="px-6 py-4 font-semibold">Тип</th>
                  <th className="px-6 py-4 font-semibold">Статус</th>
                  <th className="px-6 py-4 font-semibold">Создан</th>
                  <th className="px-6 py-4 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array.from({length: 5}).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                    </tr>
                  ))
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p>Документы не найдены</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{doc.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{doc.number}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{doc.employeeName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{doc.type}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="sm" className="h-8 hover-elevate bg-background border-border/50">
                            <Link href={`/documents/${doc.id}`}>
                              <Eye className="w-3.5 h-3.5 mr-1.5 text-primary" /> Открыть
                            </Link>
                          </Button>
                          {role === "hr" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover-elevate">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-destructive/20 shadow-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить документ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Вы уверены, что хотите удалить документ <b>{doc.number}</b>? Это действие необратимо.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="hover-elevate">Отмена</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover-elevate shadow-md"
                                  onClick={() => deleteMutation.mutate({ id: doc.id })}
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
