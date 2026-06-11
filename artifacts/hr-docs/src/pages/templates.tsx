import { useState, useRef } from "react";
import mammoth from "mammoth";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { useGetTemplates } from "@workspace/api-client-react";
import { LayoutTemplate, FileText, Settings, ArrowRight, Upload, Plus, Trash2, Loader2, FileUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, getRole } from "@/lib/auth";


function detectFields(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const reserved = new Set(["employeeName", "position", "department"]);
  const found = new Set<string>();
  let m;
  while ((m = regex.exec(content)) !== null) {
    if (!reserved.has(m[1])) found.add(m[1]);
  }
  return Array.from(found);
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function ImportDialog({ open, onClose, onCreated }: ImportDialogProps) {
  const [step, setStep] = useState<"upload" | "edit">("upload");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [detectedFields, setDetectedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const baseName = file.name.replace(/\.[^.]+$/, "");

    if (ext === "docx" || ext === "doc") {
      setLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        setContent(text);
        setDetectedFields(detectFields(text));
        if (!name) setName(baseName);
        setStep("edit");
        if (result.messages.length > 0) {
          toast({ title: "Файл прочитан с предупреждениями", description: "Часть форматирования могла быть потеряна при конвертации." });
        }
      } catch {
        toast({ title: "Ошибка чтения файла", description: "Не удалось прочитать .docx файл. Попробуйте сохранить как .txt.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setContent(text);
        setDetectedFields(detectFields(text));
        if (!name) setName(baseName);
        setStep("edit");
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  const handleManual = () => {
    setContent("");
    setDetectedFields([]);
    setStep("edit");
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    setDetectedFields(detectFields(val));
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      toast({ title: "Заполните название и содержимое", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const resp = await apiFetch("/templates", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), description: description.trim(), content: content.trim() }),
      });
      if (!resp.ok) throw new Error("Ошибка сохранения");
      toast({ title: "Шаблон создан", description: `«${name}» добавлен в список шаблонов` });
      onCreated();
      handleReset();
    } catch {
      toast({ title: "Ошибка", description: "Не удалось создать шаблон", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setName("");
    setDescription("");
    setContent("");
    setDetectedFields([]);
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleReset()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-primary" />
            {step === "upload" ? "Импорт документа" : "Настройка шаблона"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload"
              ? "Загрузите файл .docx, .doc или .txt с текстом документа, либо создайте шаблон вручную. Используйте {{поле}} для обозначения заполняемых полей."
              : "Проверьте содержимое и заполните параметры нового шаблона."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4 py-2">
            <div
              className={`border-2 border-dashed border-border/60 rounded-xl p-10 text-center transition-all ${loading ? "opacity-60 cursor-not-allowed" : "hover:border-primary/40 hover:bg-primary/5 cursor-pointer group"}`}
              onClick={() => !loading && fileRef.current?.click()}
            >
              {loading ? (
                <Loader2 className="w-10 h-10 text-primary/70 mx-auto mb-3 animate-spin" />
              ) : (
                <Upload className="w-10 h-10 text-muted-foreground/60 group-hover:text-primary/70 mx-auto mb-3 transition-colors" />
              )}
              <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {loading ? "Читаю документ..." : "Нажмите для выбора файла"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">Поддерживаются форматы: .docx, .doc, .txt</p>
              <input ref={fileRef} type="file" accept=".docx,.doc,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain" className="hidden" onChange={handleFileChange} disabled={loading} />
            </div>
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-border/40" />
              <span className="px-3 text-xs text-muted-foreground bg-background">или</span>
              <div className="flex-1 border-t border-border/40" />
            </div>
            <Button variant="outline" className="w-full" onClick={handleManual}>
              <Plus className="w-4 h-4 mr-2" />
              Создать шаблон вручную
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Название шаблона <span className="text-destructive">*</span></Label>
                <Input placeholder="Например: Соглашение о неразглашении" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Описание</Label>
                <Input placeholder="Краткое описание назначения шаблона" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Содержимое документа <span className="text-destructive">*</span></Label>
              <Textarea
                className="font-mono text-sm min-h-[220px] resize-y"
                placeholder={"ПРИКАЗ №{{orderNumber}}\n\nот {{orderDate}} г.\n\nПринять {{employeeName}} на должность {{position}}...\n\nИспользуйте {{поле}} для переменных.\nАвтоматически подставляются: {{employeeName}}, {{position}}, {{department}}"}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
              />
            </div>

            {detectedFields.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Автоматически обнаруженные поля для заполнения:</Label>
                <div className="flex flex-wrap gap-2">
                  {detectedFields.map((f) => (
                    <Badge key={f} variant="secondary" className="font-mono text-xs">
                      {`{{${f}}}`}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Поля автоматически добавятся в форму при создании документа. Поля employeeName, position, department заполняются из карточки сотрудника.
                </p>
              </div>
            )}

            <DialogFooter className="pt-2 flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")} disabled={loading}>
                Назад
              </Button>
              <Button onClick={handleSave} disabled={loading || !name.trim() || !content.trim()}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохранение...</> : <><Plus className="w-4 h-4 mr-2" />Создать шаблон</>}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Templates() {
  const { data: templates, isLoading, refetch } = useGetTemplates();
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { toast } = useToast();
  const role = getRole();

  if (role !== "hr") {
    return (
      <Layout>
        <div className="py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Недостаточно прав</h1>
          <p className="text-muted-foreground">Шаблонами документов управляет HR-сотрудник.</p>
        </div>
      </Layout>
    );
  }

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const resp = await apiFetch(`/templates/${id}`, { method: "DELETE" });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error ?? "Ошибка удаления");
      }
      toast({ title: "Шаблон удалён" });
      refetch();
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center">
              <LayoutTemplate className="w-8 h-8 mr-3 text-primary" />
              Справочник шаблонов
            </h1>
            <p className="text-muted-foreground mt-1">Доступные формы для автоматической генерации документов</p>
          </div>
          <Button onClick={() => setImportOpen(true)} className="shrink-0">
            <Upload className="w-4 h-4 mr-2" />
            Импорт / Создать
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {isLoading ? (
            Array.from({length: 6}).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))
          ) : templates?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/20 rounded-xl border border-border/50 border-dashed">
              Шаблоны не загружены в систему
            </div>
          ) : (
            templates?.map((template: any) => (
              <Card key={template.id} className="border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group flex flex-col h-full bg-card/80 backdrop-blur-sm">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    {template.isCustom && (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs bg-violet-50 text-violet-600 border-violet-200">Импортирован</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(template.id)}
                          disabled={deleting === template.id}
                        >
                          {deleting === template.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">{template.name}</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-4">{template.description || "Пользовательский шаблон"}</p>
                  
                  <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
                    <div className="text-xs text-muted-foreground flex items-center bg-secondary/50 px-2 py-1 rounded-md">
                      <Settings className="w-3 h-3 mr-1" />
                      {template.fields?.length ?? 0} полей
                    </div>
                    <Button asChild variant="ghost" size="sm" className="text-primary hover:bg-primary/10 hover-elevate -mr-2">
                      <Link href="/documents/new">
                        Использовать <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onCreated={() => { setImportOpen(false); refetch(); }}
      />
    </Layout>
  );
}
