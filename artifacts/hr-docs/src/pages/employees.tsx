import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { 
  useGetEmployees, 
  useCreateEmployee, 
  useUpdateEmployee, 
  useDeleteEmployee 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  Mail,
  Phone,
  Briefcase
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const employeeSchema = z.object({
  fullName: z.string().min(2, "Введите ФИО"),
  position: z.string().min(2, "Введите должность"),
  department: z.string().min(2, "Введите отдел"),
  employeeNumber: z.string().min(1, "Табельный номер обязателен"),
  hireDate: z.string().min(10, "Выберите дату"),
  salary: z.coerce.number().optional(),
  phone: z.string().optional(),
  email: z.string().email("Неверный email").optional().or(z.literal("")),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function Employees() {
  const { data: employees, isLoading } = useGetEmployees();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const createMutation = useCreateEmployee({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        toast({ title: "Успешно", description: "Сотрудник добавлен" });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (err) => toast({ title: "Ошибка", description: err.message, variant: "destructive" })
    }
  });

  const updateMutation = useUpdateEmployee({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
        toast({ title: "Успешно", description: "Данные обновлены" });
        setIsDialogOpen(false);
        setEditingId(null);
        form.reset();
      },
      onError: (err) => toast({ title: "Ошибка", description: err.message, variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteEmployee({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        toast({ title: "Успешно", description: "Сотрудник удален" });
      },
      onError: (err) => toast({ title: "Ошибка", description: err.message, variant: "destructive" })
    }
  });

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: "",
      position: "",
      department: "",
      employeeNumber: "",
      hireDate: new Date().toISOString().split('T')[0],
      salary: 0,
      phone: "",
      email: "",
    },
  });

  const openEdit = (employee: any) => {
    setEditingId(employee.id);
    form.reset({
      fullName: employee.fullName,
      position: employee.position,
      department: employee.department,
      employeeNumber: employee.employeeNumber,
      hireDate: employee.hireDate.split('T')[0],
      salary: employee.salary || 0,
      phone: employee.phone || "",
      email: employee.email || "",
    });
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    form.reset({
      fullName: "",
      position: "",
      department: "",
      employeeNumber: "",
      hireDate: new Date().toISOString().split('T')[0],
      salary: 0,
      phone: "",
      email: "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: EmployeeFormValues) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const filteredEmployees = employees?.filter(emp => 
    emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
    emp.department.toLowerCase().includes(search.toLowerCase()) ||
    emp.position.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center">
              <Users className="w-8 h-8 mr-3 text-primary" />
              Штат сотрудников
            </h1>
            <p className="text-muted-foreground mt-1">Управление персоналом и контактными данными</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover-elevate">
                <Plus className="w-4 h-4 mr-2" />
                Добавить сотрудника
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-border/50 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingId ? "Редактировать профиль" : "Новый сотрудник"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ФИО полностью</FormLabel>
                      <FormControl><Input placeholder="Иванов Иван Иванович" {...field} className="bg-secondary/30 focus-visible:ring-primary/20" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="department" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Отдел</FormLabel>
                        <FormControl><Input placeholder="IT отдел" {...field} className="bg-secondary/30" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="position" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Должность</FormLabel>
                        <FormControl><Input placeholder="Разработчик" {...field} className="bg-secondary/30" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="employeeNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Табельный номер</FormLabel>
                        <FormControl><Input placeholder="EMP-001" {...field} className="bg-secondary/30" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="hireDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата приёма</FormLabel>
                        <FormControl><Input type="date" {...field} className="bg-secondary/30" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="ivan@example.com" {...field} className="bg-secondary/30" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl><Input placeholder="+7 (999) 000-00-00" {...field} className="bg-secondary/30" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="hover-elevate">Отмена</Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="hover-elevate shadow-md">
                      {editingId ? "Сохранить изменения" : "Добавить в штат"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border border-border/50 shadow-sm overflow-hidden bg-card/80 backdrop-blur-sm">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-secondary/10">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Поиск по ФИО, отделу или должности..." 
                className="pl-9 bg-background border-border/50 focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                <tr>
                  <th className="px-6 py-4 font-semibold">Сотрудник</th>
                  <th className="px-6 py-4 font-semibold">Должность / Отдел</th>
                  <th className="px-6 py-4 font-semibold">Контакты</th>
                  <th className="px-6 py-4 font-semibold">Принят</th>
                  <th className="px-6 py-4 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array.from({length: 5}).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                    </tr>
                  ))
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Ничего не найдено
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm border border-primary/10">
                            {emp.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{emp.fullName}</div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{emp.employeeNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-foreground font-medium">
                          <Briefcase className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                          {emp.position}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 ml-5">{emp.department}</div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {emp.email && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Mail className="w-3 h-3 mr-1.5" /> {emp.email}
                          </div>
                        )}
                        {emp.phone && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Phone className="w-3 h-3 mr-1.5" /> {emp.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(emp.hireDate)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover-elevate h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 shadow-lg border-border/50">
                            <DropdownMenuItem onClick={() => openEdit(emp)} className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" /> Редактировать
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10">
                                  <Trash2 className="w-4 h-4 mr-2" /> Удалить
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-destructive/20 shadow-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить сотрудника?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие нельзя отменить. Все связанные документы могут потерять привязку к профилю сотрудника.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="hover-elevate">Отмена</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover-elevate shadow-md shadow-destructive/20"
                                    onClick={() => deleteMutation.mutate({ id: emp.id })}
                                  >
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
