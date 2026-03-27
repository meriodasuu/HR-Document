import { Router, type IRouter } from "express";
import { db, customTemplatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

export const STATIC_TEMPLATES = [
  {
    id: 1,
    name: "Приказ о приёме на работу",
    type: "order_hire",
    description: "Оформление приёма нового сотрудника на работу (форма Т-1)",
    isCustom: false,
    fields: [
      { key: "orderNumber", label: "Номер приказа", type: "text", required: true },
      { key: "orderDate", label: "Дата приказа", type: "date", required: true },
      { key: "startDate", label: "Дата начала работы", type: "date", required: true },
      { key: "probationMonths", label: "Испытательный срок (месяцев)", type: "number", required: false },
      { key: "workConditions", label: "Условия работы", type: "select", required: true, options: ["Основное место работы", "По совместительству"] },
    ],
    content: `ПРИКАЗ №{{orderNumber}}
о приёме работника на работу

от {{orderDate}} г.

Принять {{employeeName}} на работу в отдел {{department}} на должность {{position}} с {{startDate}}.
Условия труда: {{workConditions}}.
{{#probationMonths}}Испытательный срок: {{probationMonths}} мес.{{/probationMonths}}

Основание: трудовой договор.

Директор: _____________________ / _____________________`,
  },
  {
    id: 2,
    name: "Приказ об увольнении",
    type: "order_dismiss",
    description: "Оформление увольнения сотрудника (форма Т-8)",
    isCustom: false,
    fields: [
      { key: "orderNumber", label: "Номер приказа", type: "text", required: true },
      { key: "orderDate", label: "Дата приказа", type: "date", required: true },
      { key: "dismissDate", label: "Дата увольнения", type: "date", required: true },
      { key: "reason", label: "Основание увольнения", type: "select", required: true, options: ["По собственному желанию (ст. 80 ТК РФ)", "По соглашению сторон (ст. 78 ТК РФ)", "По истечении срока договора (ст. 79 ТК РФ)", "По сокращению штата (ст. 81 ТК РФ)"] },
    ],
    content: `ПРИКАЗ №{{orderNumber}}
о прекращении (расторжении) трудового договора с работником (увольнении)

от {{orderDate}} г.

Прекратить действие трудового договора с {{employeeName}}, {{position}} отдела {{department}}.

Дата увольнения: {{dismissDate}}.
Основание: {{reason}}.

Директор: _____________________ / _____________________

С приказом ознакомлен(а): _____________________ / {{employeeName}}`,
  },
  {
    id: 3,
    name: "Трудовой договор",
    type: "contract",
    description: "Заключение трудового договора с сотрудником",
    isCustom: false,
    fields: [
      { key: "contractNumber", label: "Номер договора", type: "text", required: true },
      { key: "contractDate", label: "Дата договора", type: "date", required: true },
      { key: "startDate", label: "Дата начала работы", type: "date", required: true },
      { key: "salaryAmount", label: "Оклад (руб.)", type: "number", required: true },
      { key: "workSchedule", label: "График работы", type: "select", required: true, options: ["Пятидневная рабочая неделя", "Сменный график", "Гибкий график"] },
    ],
    content: `ТРУДОВОЙ ДОГОВОР №{{contractNumber}}

от {{contractDate}} г.

ООО «Организация», именуемое в дальнейшем «Работодатель», и
{{employeeName}}, именуемый(ая) в дальнейшем «Работник», заключили настоящий договор.

1. ПРЕДМЕТ ДОГОВОРА
1.1. Работник принимается на работу в отдел {{department}} на должность {{position}}.
1.2. Дата начала работы: {{startDate}}.
1.3. График работы: {{workSchedule}}.

2. ОПЛАТА ТРУДА
2.1. Работнику устанавливается должностной оклад в размере {{salaryAmount}} руб. в месяц.

3. ПРАВА И ОБЯЗАННОСТИ СТОРОН
3.1. Работник обязан добросовестно исполнять трудовые обязанности, соблюдать правила внутреннего трудового распорядка.
3.2. Работодатель обязан обеспечить Работнику условия труда, выплачивать заработную плату в установленные сроки.

Работодатель: ООО «Организация»
Директор _____________________ / _____________________

Работник _____________________ / {{employeeName}}`,
  },
  {
    id: 4,
    name: "Приказ о переводе",
    type: "order_transfer",
    description: "Оформление перевода сотрудника на другую должность или в другой отдел",
    isCustom: false,
    fields: [
      { key: "orderNumber", label: "Номер приказа", type: "text", required: true },
      { key: "orderDate", label: "Дата приказа", type: "date", required: true },
      { key: "transferDate", label: "Дата перевода", type: "date", required: true },
      { key: "newPosition", label: "Новая должность", type: "text", required: true },
      { key: "newDepartment", label: "Новый отдел", type: "text", required: true },
      { key: "newSalary", label: "Новый оклад (руб.)", type: "number", required: false },
    ],
    content: `ПРИКАЗ №{{orderNumber}}
о переводе работника на другую работу

от {{orderDate}} г.

Перевести {{employeeName}} с {{transferDate}}:
— Отдел: {{newDepartment}}
— Должность: {{newPosition}}
{{#newSalary}}— Оклад: {{newSalary}} руб.{{/newSalary}}

Основание: соглашение о переводе.

Директор: _____________________ / _____________________

С приказом ознакомлен(а): _____________________ / {{employeeName}}`,
  },
  {
    id: 5,
    name: "Приказ об отпуске",
    type: "order_vacation",
    description: "Оформление ежегодного оплачиваемого отпуска (форма Т-6)",
    isCustom: false,
    fields: [
      { key: "orderNumber", label: "Номер приказа", type: "text", required: true },
      { key: "orderDate", label: "Дата приказа", type: "date", required: true },
      { key: "vacationFrom", label: "Начало отпуска", type: "date", required: true },
      { key: "vacationTo", label: "Конец отпуска", type: "date", required: true },
      { key: "vacationDays", label: "Количество дней", type: "number", required: true },
    ],
    content: `ПРИКАЗ №{{orderNumber}}
о предоставлении отпуска работнику

от {{orderDate}} г.

Предоставить {{employeeName}}, {{position}} отдела {{department}},
ежегодный основной оплачиваемый отпуск продолжительностью {{vacationDays}} календарных дней.

Период отпуска: с {{vacationFrom}} по {{vacationTo}}.

Директор: _____________________ / _____________________

С приказом ознакомлен(а): _____________________ / {{employeeName}}`,
  },
  {
    id: 6,
    name: "Акт выполненных работ",
    type: "act",
    description: "Акт о выполнении работ или оказании услуг",
    isCustom: false,
    fields: [
      { key: "actNumber", label: "Номер акта", type: "text", required: true },
      { key: "actDate", label: "Дата акта", type: "date", required: true },
      { key: "workDescription", label: "Описание выполненных работ", type: "text", required: true },
      { key: "workPeriodFrom", label: "Период выполнения (начало)", type: "date", required: true },
      { key: "workPeriodTo", label: "Период выполнения (конец)", type: "date", required: true },
      { key: "amount", label: "Сумма (руб.)", type: "number", required: true },
    ],
    content: `АКТ №{{actNumber}}
о выполненных работах (оказанных услугах)

от {{actDate}} г.

Составлен между ООО «Организация» и {{employeeName}} ({{position}}).

Период выполнения работ: с {{workPeriodFrom}} по {{workPeriodTo}}.

Наименование выполненных работ:
{{workDescription}}

Стоимость работ: {{amount}} руб.

Работы выполнены в полном объёме и в установленные сроки.

Заказчик: _____________________ / _____________________
Исполнитель: _____________________ / {{employeeName}}`,
  },
];

router.get("/", async (_req, res) => {
  const customRows = await db.select().from(customTemplatesTable).orderBy(customTemplatesTable.createdAt);
  const custom = customRows.map((r) => ({
    id: r.id + 1000,
    name: r.name,
    type: r.type,
    description: r.description,
    fields: r.fields as any[],
    content: r.content,
    isCustom: true,
    createdAt: r.createdAt.toISOString(),
  }));
  res.json([...STATIC_TEMPLATES, ...custom]);
});

router.post("/", async (req, res) => {
  const { name, description, content } = req.body ?? {};
  if (!name || !content) {
    return res.status(400).json({ error: "Укажите название и содержимое шаблона" });
  }

  // Auto-detect {{placeholder}} fields from content
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const found = new Set<string>();
  let m;
  while ((m = placeholderRegex.exec(content)) !== null) {
    const key = m[1];
    if (!["employeeName", "position", "department"].includes(key)) {
      found.add(key);
    }
  }

  const fields = Array.from(found).map((key) => ({
    key,
    label: key,
    type: "text",
    required: true,
  }));

  const [row] = await db
    .insert(customTemplatesTable)
    .values({ name, type: "custom", description: description ?? "", fields, content })
    .returning();

  res.status(201).json({
    id: row.id + 1000,
    name: row.name,
    type: row.type,
    description: row.description,
    fields: row.fields,
    content: row.content,
    isCustom: true,
    createdAt: row.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const dbId = Number(req.params.id) - 1000;
  if (dbId < 1) {
    return res.status(400).json({ error: "Нельзя удалить встроенный шаблон" });
  }
  await db.delete(customTemplatesTable).where(eq(customTemplatesTable.id, dbId));
  res.json({ success: true, message: "Шаблон удалён" });
});

export default router;
