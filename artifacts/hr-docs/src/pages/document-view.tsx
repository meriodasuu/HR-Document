import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetDocument, useSignDocument } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Printer, 
  PenTool, 
  ArrowLeft,
  Calendar,
  User,
  Hash,
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-sm py-1 px-3">Черновик</Badge>;
    case 'signed':
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-sm py-1 px-3">Подписан</Badge>;
    case 'printed':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-sm py-1 px-3">Напечатан</Badge>;
    default:
      return <Badge variant="outline" className="text-sm py-1 px-3">{status}</Badge>;
  }
}

export default function DocumentView() {
  const [, params] = useRoute("/documents/:id");
  const id = Number(params?.id);
  
  const { data: doc, isLoading } = useGetDocument(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const signMutation = useSignDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/documents", id] });
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        toast({ title: "Успешно", description: "Документ переведен в статус 'Подписан'" });
      },
      onError: (err) => toast({ title: "Ошибка", description: err.message, variant: "destructive" })
    }
  });

  const handlePrint = () => {
    window.print();
    // In a real app, printing might trigger a status change to 'printed' via API
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3"><Skeleton className="h-[800px] w-full" /></div>
            <div className="space-y-4"><Skeleton className="h-64 w-full" /></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!doc) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h2 className="text-2xl font-bold text-foreground">Документ не найден</h2>
          <Button asChild variant="outline" className="mt-4 hover-elevate">
            <Link href="/documents">Вернуться к списку</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-20 animate-in fade-in duration-500">
        
        {/* Top actions - Hidden in print */}
        <div className="flex items-center justify-between print:hidden">
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground hover-elevate -ml-4">
            <Link href="/documents">
              <ArrowLeft className="w-4 h-4 mr-2" /> Реестр документов
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="hover-elevate bg-background border-border/60">
              <Printer className="w-4 h-4 mr-2" /> Печать
            </Button>
            {doc.status !== 'signed' && (
              <Button 
                onClick={() => signMutation.mutate({ id: doc.id })} 
                disabled={signMutation.isPending}
                className="bg-primary text-primary-foreground shadow-md shadow-primary/20 hover-elevate"
              >
                <PenTool className="w-4 h-4 mr-2" />
                Утвердить подпись
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Main Document Area */}
          <div className="xl:col-span-3">
            <Card id="printable-document" className="bg-white text-black p-10 sm:p-16 md:p-20 min-h-[1056px] shadow-xl border border-gray-200 official-document print:shadow-none print:border-none">
              {/* Document Header */}
              <div className="text-center mb-12 border-b-2 border-black pb-6">
                <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">{doc.title}</h1>
                <p className="text-gray-600 font-sans text-sm">№ {doc.number} от {formatDate(doc.createdAt)}</p>
              </div>

              {/* Document Content - rendering raw HTML/text safely. Assuming pre-formatted string with newlines for simplicity based on schema */}
              <div className="whitespace-pre-wrap text-justify leading-loose text-lg font-serif">
                {doc.content}
              </div>

              {/* Document Signatures */}
              <div className="mt-24 pt-12 border-t border-gray-300 grid grid-cols-2 gap-10">
                <div>
                  <p className="font-bold mb-8">РАБОТОДАТЕЛЬ:</p>
                  <div className="border-b border-black mb-2 h-8"></div>
                  <p className="text-sm text-gray-500 text-center">подпись / М.П.</p>
                </div>
                <div>
                  <p className="font-bold mb-8">РАБОТНИК:</p>
                  <div className="border-b border-black mb-2 h-8 flex items-end">
                    <span className="italic px-2">{doc.employeeName}</span>
                  </div>
                  <p className="text-sm text-gray-500 text-center">подпись / расшифровка</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Meta Info - Hidden in print */}
          <div className="space-y-4 print:hidden">
            <Card className="p-5 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Атрибуты</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground flex items-center mb-1"><Hash className="w-3.5 h-3.5 mr-1.5"/> Номер</p>
                  <p className="font-medium font-mono bg-secondary/50 px-2 py-1 rounded inline-block">{doc.number}</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground flex items-center mb-1"><User className="w-3.5 h-3.5 mr-1.5"/> Сотрудник</p>
                  <p className="font-medium">{doc.employeeName}</p>
                </div>

                <div>
                  <p className="text-muted-foreground flex items-center mb-1"><Calendar className="w-3.5 h-3.5 mr-1.5"/> Создан</p>
                  <p className="font-medium">{formatDate(doc.createdAt)}</p>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-muted-foreground mb-2">Текущий статус</p>
                  <StatusBadge status={doc.status} />
                </div>
                
                {doc.status === 'signed' && doc.signedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mt-2">Подписан: {formatDate(doc.signedAt)}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
