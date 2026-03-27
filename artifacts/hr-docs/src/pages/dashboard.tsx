import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout";
import { useGetStats, useGetDocuments } from "@workspace/api-client-react";
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  Printer, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Activity
} from "lucide-react";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Черновик</Badge>;
    case 'signed':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Подписан</Badge>;
    case 'printed':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Напечатан</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: docs, isLoading: docsLoading } = useGetDocuments();

  const recentDocs = docs?.slice(0, 5) || [];

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Обзор системы</h1>
            <p className="text-muted-foreground mt-1 text-sm">Оперативная сводка по документам и сотрудникам</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="bg-background shadow-sm hover:bg-secondary/80 hover-elevate transition-all">
              <Link href="/employees">
                <Users className="w-4 h-4 mr-2 text-primary" />
                Сотрудники
              </Link>
            </Button>
            <Button asChild className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover-elevate transition-all">
              <Link href="/documents/new">
                <Plus className="w-4 h-4 mr-2" />
                Создать документ
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : (
            <>
              <Card className="p-6 border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText className="w-24 h-24" />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Всего документов</p>
                    <p className="text-4xl font-bold text-foreground">{stats?.totalDocuments || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs text-muted-foreground relative z-10">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-green-600 font-medium mr-1">+{stats?.documentsThisMonth || 0}</span> в этом месяце
                </div>
              </Card>

              <Card className="p-6 border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Clock className="w-24 h-24" />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">На подпись</p>
                    <p className="text-4xl font-bold text-foreground">{stats?.draftDocuments || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <CheckCircle className="w-24 h-24" />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Подписано</p>
                    <p className="text-4xl font-bold text-foreground">{stats?.signedDocuments || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Users className="w-24 h-24" />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Сотрудников</p>
                    <p className="text-4xl font-bold text-foreground">{stats?.totalEmployees || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Recent Documents Table */}
        <Card className="border border-border/50 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50 flex items-center justify-between bg-secondary/20">
            <h2 className="text-lg font-semibold text-foreground flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Последние документы
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover-elevate">
              <Link href="/documents">
                Смотреть все
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                <tr>
                  <th className="px-6 py-4 font-semibold">Номер</th>
                  <th className="px-6 py-4 font-semibold">Название</th>
                  <th className="px-6 py-4 font-semibold">Сотрудник</th>
                  <th className="px-6 py-4 font-semibold">Статус</th>
                  <th className="px-6 py-4 font-semibold">Дата создания</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {docsLoading ? (
                  Array.from({length: 5}).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-4"><Skeleton className="h-6 w-full" /></td>
                    </tr>
                  ))
                ) : recentDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p>Документы пока не созданы</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-secondary/30 transition-colors group cursor-pointer" onClick={() => window.location.href = `/documents/${doc.id}`}>
                      <td className="px-6 py-4 font-medium text-foreground">{doc.number}</td>
                      <td className="px-6 py-4 text-muted-foreground group-hover:text-primary transition-colors">{doc.title}</td>
                      <td className="px-6 py-4">{doc.employeeName}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(doc.createdAt)}</td>
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
