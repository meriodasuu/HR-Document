import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, type ChangeEvent } from "react";
import { useGetDocument } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Printer, 
  PenTool, 
  ArrowLeft,
  Calendar,
  User,
  Hash,
  Send,
  Upload,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, getRole } from "@/lib/auth";

const SIGNATURE_IMAGE_KEY = "director_signature_image";
const SIGNATURE_NAME_KEY = "director_signature_name";
const DEFAULT_SIGNATURE_NAME = "Директор";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-sm py-1 px-3">Черновик</Badge>;
    case 'pending_signature':
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-sm py-1 px-3">На подписи</Badge>;
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
  const role = getRole();
  const [actionLoading, setActionLoading] = useState(false);
  const [signatureImage, setSignatureImage] = useState(() => localStorage.getItem(SIGNATURE_IMAGE_KEY) ?? "");
  const [signatureName, setSignatureName] = useState(() => localStorage.getItem(SIGNATURE_NAME_KEY) ?? DEFAULT_SIGNATURE_NAME);

  const refreshDocument = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/documents/${id}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const runDocumentAction = async (path: string, successMessage: string) => {
    setActionLoading(true);
    try {
      const resp = await apiFetch(path, { method: "POST" });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error ?? "Не удалось выполнить действие");
      }
      const updatedDoc = await resp.json();
      queryClient.setQueryData([`/api/documents/${id}`], updatedDoc);
      refreshDocument();
      toast({ title: "Успешно", description: successMessage });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
    // In a real app, printing might trigger a status change to 'printed' via API
  };

  const handleEmployeeScanUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!doc) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Ошибка", description: "Загрузите скан в формате PNG, JPG, WEBP или PDF", variant: "destructive" });
      return;
    }

    if (file.size > 4_500_000) {
      toast({ title: "Ошибка", description: "Файл скана должен быть меньше 4.5 МБ", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const scanDataUrl = String(reader.result ?? "");
      setActionLoading(true);
      try {
        const resp = await apiFetch(`/documents/${doc.id}/employee-scan`, {
          method: "POST",
          body: JSON.stringify({ scanDataUrl, fileName: file.name }),
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error ?? "Не удалось загрузить скан документа");
        }
        const updatedDoc = await resp.json();
        queryClient.setQueryData([`/api/documents/${id}`], updatedDoc);
        refreshDocument();
        toast({ title: "Успешно", description: "Скан загружен, документ ожидает подписи директора" });
      } catch (err: any) {
        toast({ title: "Ошибка", description: err.message, variant: "destructive" });
      } finally {
        setActionLoading(false);
        event.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureNameChange = (value: string) => {
    setSignatureName(value);
    localStorage.setItem(SIGNATURE_NAME_KEY, value);
  };

  const handleSignatureUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Ошибка", description: "Загрузите изображение подписи", variant: "destructive" });
      return;
    }

    if (file.size > 1_500_000) {
      toast({ title: "Ошибка", description: "Файл подписи должен быть меньше 1.5 МБ", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setSignatureImage(dataUrl);
      localStorage.setItem(SIGNATURE_IMAGE_KEY, dataUrl);
      toast({ title: "Успешно", description: "Подпись обновлена" });
    };
    reader.readAsDataURL(file);
  };

  const clearSignatureImage = () => {
    setSignatureImage("");
    localStorage.removeItem(SIGNATURE_IMAGE_KEY);
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground hover-elevate -ml-4">
            <Link href="/documents">
              <ArrowLeft className="w-4 h-4 mr-2" /> Реестр документов
            </Link>
          </Button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" onClick={handlePrint} className="hover-elevate bg-background border-border/60">
              <Printer className="w-4 h-4 mr-2" /> Печать
            </Button>
            {false && role === "hr" && doc!.status === "draft" && (
              <Button 
                onClick={() => runDocumentAction(`/documents/${doc!.id}/send-signature`, "Документ отправлен директору на подпись")} 
                disabled={actionLoading}
                className="bg-primary text-primary-foreground shadow-md shadow-primary/20 hover-elevate"
              >
                <Send className="w-4 h-4 mr-2" />
                Отправить на подпись
              </Button>
            )}
            {role === "director" && doc.status === "pending_signature" && (
              <Button 
                onClick={() => runDocumentAction(`/documents/${doc.id}/sign`, "Документ подписан директором")} 
                disabled={actionLoading}
                className="bg-primary text-primary-foreground shadow-md shadow-primary/20 hover-elevate"
              >
                <PenTool className="w-4 h-4 mr-2" />
                Подписать документ
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Main Document Area */}
          <div className="xl:col-span-3">
            <Card id="printable-document" className="bg-white text-black p-5 sm:p-10 md:p-16 lg:p-20 min-h-[720px] sm:min-h-[1056px] shadow-xl border border-gray-200 official-document print:shadow-none print:border-none">
              {/* Document Header */}
              <div className="text-center mb-12 border-b-2 border-black pb-6">
                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider mb-2">{doc.title}</h1>
                <p className="text-gray-600 font-sans text-sm">№ {doc.number} от {formatDate(doc.createdAt)}</p>
              </div>

              {/* Document Content - rendering raw HTML/text safely. Assuming pre-formatted string with newlines for simplicity based on schema */}
              <div className="whitespace-pre-wrap text-left sm:text-justify leading-loose text-base sm:text-lg font-serif">
                {doc.content}
              </div>

              {/* Document Signatures */}
              <div className="mt-16 sm:mt-24 pt-8 sm:pt-12 border-t border-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div>
                  <p className="font-bold mb-8">РАБОТОДАТЕЛЬ:</p>
                  <div className="border-b border-black mb-2 h-16 flex items-end justify-center">
                    {doc.status === "signed" && (
                      signatureImage ? (
                        <img src={signatureImage} alt="Подпись директора" className="max-h-14 max-w-[220px] object-contain" />
                      ) : (
                        <span className="italic px-2 text-base">{signatureName || DEFAULT_SIGNATURE_NAME}</span>
                      )
                    )}
                  </div>
                  <p className="text-sm text-gray-500 text-center">{signatureName || DEFAULT_SIGNATURE_NAME} / подпись</p>
                  {doc.status === "signed" && doc.signedAt && (
                    <p className="text-xs text-gray-500 text-center mt-1">Дата подписи: {formatDate(doc.signedAt)}</p>
                  )}
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

            <Card className="p-5 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
              <h3 className="font-semibold text-foreground mb-4">Скан с подписью сотрудника</h3>
              <div className="space-y-4 text-sm">
                {doc.employeeScanDataUrl ? (
                  <>
                    <div className="rounded-md border border-border/60 bg-white p-3">
                      {doc.employeeScanDataUrl.startsWith("data:image/") ? (
                        <img src={doc.employeeScanDataUrl} alt="Скан документа с подписью сотрудника" className="mx-auto max-h-48 object-contain" />
                      ) : (
                        <p className="text-center text-muted-foreground">Загружен файл: {doc.employeeScanFileName ?? "скан документа"}</p>
                      )}
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <a href={doc.employeeScanDataUrl} target="_blank" rel="noreferrer">
                        Открыть скан
                      </a>
                    </Button>
                    {doc.employeeSignedAt && (
                      <p className="text-xs text-muted-foreground">Скан загружен: {formatDate(doc.employeeSignedAt)}</p>
                    )}
                  </>
                ) : (
                  <div className="rounded-md border border-dashed border-border/70 p-3 text-center text-xs text-muted-foreground">
                    Скан подписанного сотрудником документа еще не загружен.
                  </div>
                )}

                {role === "hr" && doc.status === "draft" && (
                  <div className="space-y-2">
                    <Label htmlFor="employeeScan">Загрузить скан после подписи сотрудника</Label>
                    <Input
                      id="employeeScan"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={handleEmployeeScanUpload}
                      disabled={actionLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      После загрузки скана документ получит статус ожидания подписи директора.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {role === "director" && (
              <Card className="p-5 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                <h3 className="font-semibold text-foreground mb-4">Подпись директора</h3>
                <div className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <Label htmlFor="signatureName">Расшифровка</Label>
                    <Input
                      id="signatureName"
                      value={signatureName}
                      onChange={(event) => handleSignatureNameChange(event.target.value)}
                      placeholder="Например: Иванов И.И."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signatureImage">Изображение подписи</Label>
                    <Input
                      id="signatureImage"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleSignatureUpload}
                    />
                  </div>

                  {signatureImage ? (
                    <div className="rounded-md border border-border/60 bg-white p-3">
                      <img src={signatureImage} alt="Текущая подпись" className="mx-auto max-h-20 object-contain" />
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border/70 p-3 text-center text-xs text-muted-foreground">
                      Подпись пока не загружена
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Label htmlFor="signatureImage" className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Загрузить
                      </Label>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSignatureImage}
                      disabled={!signatureImage}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Очистить
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
