import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { useGetTemplates } from "@workspace/api-client-react";
import { LayoutTemplate, FileText, Settings, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Templates() {
  const { data: templates, isLoading } = useGetTemplates();

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center">
            <LayoutTemplate className="w-8 h-8 mr-3 text-primary" />
            Справочник шаблонов
          </h1>
          <p className="text-muted-foreground mt-1">Доступные формы для автоматической генерации документов</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {isLoading ? (
            Array.from({length: 6}).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))
          ) : templates?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/20 rounded-xl border border-border/50 border-dashed">
              Шаблоны не загружены в систему
            </div>
          ) : (
            templates?.map((template) => (
              <Card key={template.id} className="border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group flex flex-col h-full bg-card/80 backdrop-blur-sm">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">{template.name}</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-4">{template.description}</p>
                  
                  <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
                    <div className="text-xs text-muted-foreground flex items-center bg-secondary/50 px-2 py-1 rounded-md">
                      <Settings className="w-3 h-3 mr-1" />
                      {template.fields.length} полей
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
    </Layout>
  );
}
