import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetTemplates, useGetEmployees, useCreateDocument } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  FilePlus, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  FileText,
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRole } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const MIN_DATE = "1900-01-01";
const MAX_DATE = "2100-12-31";

export default function CreateDocument() {
  const [step, setStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  
  const { data: templates, isLoading: templatesLoading } = useGetTemplates();
  const { data: employees, isLoading: employeesLoading } = useGetEmployees();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const role = getRole();

  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        toast({ title: "Успешно", description: "Документ создан" });
        setLocation(`/documents/${data.id}`);
      },
      onError: (err) => toast({ title: "Ошибка", description: err.message, variant: "destructive" })
    }
  });

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);
  const selectedEmployee = employees?.find(e => e.id === selectedEmployeeId);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleCreate = () => {
    if (!selectedTemplateId || !selectedEmployeeId) return;
    createMutation.mutate({
      data: {
        templateId: selectedTemplateId,
        employeeId: selectedEmployeeId,
        fields
      }
    });
  };

  const isStep2Valid = selectedEmployeeId !== null;
  const isStep3Valid = selectedTemplate?.fields.every(f => !f.required || (fields[f.key] && fields[f.key].trim() !== "")) ?? false;

  if (role !== "hr") {
    return (
      <Layout>
        <div className="py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Недостаточно прав</h1>
          <p className="text-muted-foreground">Создавать документы может только HR-сотрудник.</p>
          <Button asChild variant="outline">
            <Link href="/documents">Вернуться к документам</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
            <FilePlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Создание документа</h1>
          <p className="text-muted-foreground">Мастер формирования нового документа по шаблону</p>
        </div>

        {/* Stepper Progress */}
        <div className="flex items-center justify-center mb-8">
          {[
            { num: 1, title: "Шаблон", icon: FileText },
            { num: 2, title: "Сотрудник", icon: UserCheck },
            { num: 3, title: "Данные", icon: CheckCircle2 }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-all duration-300
                ${step === s.num ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 
                  step > s.num ? 'bg-primary/20 border-primary text-primary' : 
                  'bg-background border-border text-muted-foreground'}
              `}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className={`ml-3 font-medium text-sm hidden sm:block ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
              {i < 2 && <div className={`w-12 sm:w-24 h-0.5 mx-4 ${step > s.num ? 'bg-primary/50' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <Card className="border border-border/50 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* STEP 1: Template Selection */}
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Выберите тип документа</h2>
                {templatesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates?.map(template => (
                      <div 
                        key={template.id}
                        onClick={() => setSelectedTemplateId(template.id)}
                        className={`
                          p-5 rounded-xl border cursor-pointer transition-all duration-200
                          ${selectedTemplateId === template.id 
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/20' 
                            : 'border-border/60 hover:border-primary/50 hover:bg-secondary/30 hover:shadow-sm'}
                        `}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${selectedTemplateId === template.id ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleNext} disabled={!selectedTemplateId} className="hover-elevate shadow-md px-8">
                    Далее <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Employee Selection */}
            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Укажите сотрудника</h2>
                <div className="max-w-md space-y-4 py-4">
                  <Label>Поиск сотрудника</Label>
                  <Select 
                    value={selectedEmployeeId?.toString()} 
                    onValueChange={(v) => setSelectedEmployeeId(Number(v))}
                  >
                    <SelectTrigger className="w-full h-12 bg-secondary/20">
                      <SelectValue placeholder="Выберите из списка..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.fullName} ({emp.position})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedEmployee && (
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 mt-4 space-y-2">
                      <div className="text-sm"><span className="text-muted-foreground w-24 inline-block">Отдел:</span> <span className="font-medium">{selectedEmployee.department}</span></div>
                      <div className="text-sm"><span className="text-muted-foreground w-24 inline-block">Табельный:</span> <span className="font-mono">{selectedEmployee.employeeNumber}</span></div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between pt-4 border-t border-border/50">
                  <Button variant="outline" onClick={handleBack} className="hover-elevate">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Назад
                  </Button>
                  <Button onClick={handleNext} disabled={!isStep2Valid} className="hover-elevate shadow-md px-8">
                    Далее <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Fill Fields & Preview */}
            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Заполнение данных</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Form */}
                  <div className="space-y-5 bg-secondary/10 p-5 rounded-xl border border-border/40">
                    <h3 className="font-medium flex items-center text-primary"><FilePlus className="w-4 h-4 mr-2"/> Переменные шаблона</h3>
                    {selectedTemplate?.fields.map(field => (
                      <div key={field.key} className="space-y-2">
                        <Label className="flex items-center">
                          {field.label} {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {field.type === 'select' && field.options ? (
                          <Select 
                            value={fields[field.key] || ""} 
                            onValueChange={(v) => setFields({...fields, [field.key]: v})}
                          >
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Выберите..." />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input 
                            type={field.type} 
                            placeholder={`Введите ${field.label.toLowerCase()}`}
                            value={fields[field.key] || ""}
                            onChange={(e) => setFields({...fields, [field.key]: e.target.value})}
                            min={field.type === "date" ? MIN_DATE : undefined}
                            max={field.type === "date" ? MAX_DATE : undefined}
                            className="bg-background"
                          />
                        )}
                      </div>
                    ))}
                    {selectedTemplate?.fields.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">Шаблон не требует ввода дополнительных данных.</p>
                    )}
                  </div>

                  {/* Info Summary */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Сводка</h3>
                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <ul className="space-y-3 text-sm">
                        <li className="flex justify-between border-b border-border/50 pb-2">
                          <span className="text-muted-foreground">Документ:</span>
                          <span className="font-semibold text-right">{selectedTemplate?.name}</span>
                        </li>
                        <li className="flex justify-between border-b border-border/50 pb-2">
                          <span className="text-muted-foreground">Сотрудник:</span>
                          <span className="font-semibold text-right">{selectedEmployee?.fullName}</span>
                        </li>
                        <li className="flex justify-between pb-1">
                          <span className="text-muted-foreground">Статус:</span>
                          <span className="text-yellow-600 font-medium">Черновик</span>
                        </li>
                      </ul>
                    </Card>
                    <p className="text-xs text-muted-foreground">
                      Документ будет создан со статусом "Черновик". Вы сможете распечатать и подписать его позже.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-border/50">
                  <Button variant="outline" onClick={handleBack} className="hover-elevate">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Назад
                  </Button>
                  <Button 
                    onClick={handleCreate} 
                    disabled={!isStep3Valid || createMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover-elevate shadow-lg shadow-primary/25 px-8"
                  >
                    {createMutation.isPending ? "Формирование..." : "Сформировать документ"}
                    {!createMutation.isPending && <CheckCircle2 className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </div>
            )}

          </div>
        </Card>
      </div>
    </Layout>
  );
}
