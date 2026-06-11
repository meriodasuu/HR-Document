export interface DemoEmployee {
  id: number;
  fullName: string;
  position: string;
  department: string;
  employeeNumber: string;
  hireDate: string;
  salary?: number;
  phone?: string;
  email?: string;
  createdAt: Date;
}

interface DemoEmployeeInput {
  fullName: string;
  position: string;
  department: string;
  employeeNumber: string;
  hireDate: string;
  salary?: number;
  phone?: string;
  email?: string;
}

export interface DemoDocument {
  id: number;
  number: string;
  type: string;
  title: string;
  status: "draft" | "pending_signature" | "signed" | "printed";
  employeeId: number;
  content: string;
  templateId?: number;
  signedAt?: Date;
  createdAt: Date;
}

export interface DemoTemplate {
  id: number;
  name: string;
  type: string;
  description: string;
  fields: Array<{
    key: string;
    label: string;
    type: "text" | "date" | "number" | "select";
    required: boolean;
    options?: string[];
  }>;
  content: string;
  createdAt: Date;
}

let nextEmployeeId = 4;
let nextDocumentId = 3;
let nextTemplateId = 1;

const employees: DemoEmployee[] = [
  {
    id: 1,
    fullName: "Ivan Petrov",
    position: "HR manager",
    department: "People Operations",
    employeeNumber: "EMP-001",
    hireDate: "2024-02-12",
    salary: 95000,
    phone: "+7 900 111-22-33",
    email: "ivan.petrov@example.com",
    createdAt: new Date("2024-02-12T09:00:00.000Z"),
  },
  {
    id: 2,
    fullName: "Anna Smirnova",
    position: "Accountant",
    department: "Finance",
    employeeNumber: "EMP-002",
    hireDate: "2023-09-01",
    salary: 110000,
    phone: "+7 900 222-33-44",
    email: "anna.smirnova@example.com",
    createdAt: new Date("2023-09-01T09:00:00.000Z"),
  },
  {
    id: 3,
    fullName: "Dmitry Orlov",
    position: "Frontend developer",
    department: "IT",
    employeeNumber: "EMP-003",
    hireDate: "2025-01-20",
    salary: 160000,
    phone: "+7 900 333-44-55",
    email: "dmitry.orlov@example.com",
    createdAt: new Date("2025-01-20T09:00:00.000Z"),
  },
];

const documents: DemoDocument[] = [
  {
    id: 1,
    number: "P-001/2026",
    type: "order_hire",
    title: "Hiring order",
    status: "signed",
    employeeId: 3,
    templateId: 1,
    content: [
      "HIRING ORDER No. 001",
      "",
      "Accept Dmitry Orlov to the IT department as Frontend developer.",
      "Start date: 2025-01-20.",
      "",
      "Director: _____________________",
    ].join("\n"),
    signedAt: new Date("2026-06-01T12:00:00.000Z"),
    createdAt: new Date("2026-06-01T10:00:00.000Z"),
  },
  {
    id: 2,
    number: "TD-002/2026",
    type: "contract",
    title: "Employment contract",
    status: "draft",
    employeeId: 1,
    templateId: 3,
    content: [
      "EMPLOYMENT CONTRACT No. 002",
      "",
      "Employer and Ivan Petrov agree on employment terms.",
      "Position: HR manager.",
      "Department: People Operations.",
      "",
      "Employee: _____________________",
    ].join("\n"),
    createdAt: new Date("2026-06-03T10:00:00.000Z"),
  },
];

const customTemplates: DemoTemplate[] = [];

export const demoStore = {
  isEnabled: !process.env.DATABASE_URL || process.env.DEMO_MODE === "1",

  listEmployees() {
    return [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName));
  },

  getEmployee(id: number) {
    return employees.find((employee) => employee.id === id);
  },

  createEmployee(input: DemoEmployeeInput) {
    const employee: DemoEmployee = {
      id: nextEmployeeId++,
      fullName: input.fullName,
      position: input.position,
      department: input.department,
      employeeNumber: input.employeeNumber,
      hireDate: input.hireDate,
      salary: input.salary,
      phone: input.phone ?? undefined,
      email: input.email ?? undefined,
      createdAt: new Date(),
    };
    employees.push(employee);
    return employee;
  },

  updateEmployee(id: number, input: DemoEmployeeInput) {
    const employee = this.getEmployee(id);
    if (!employee) return undefined;
    Object.assign(employee, {
      ...input,
      salary: input.salary,
      phone: input.phone ?? undefined,
      email: input.email ?? undefined,
    });
    return employee;
  },

  deleteEmployee(id: number) {
    const index = employees.findIndex((employee) => employee.id === id);
    if (index >= 0) employees.splice(index, 1);
    for (let i = documents.length - 1; i >= 0; i -= 1) {
      if (documents[i]?.employeeId === id) documents.splice(i, 1);
    }
  },

  listDocuments() {
    return [...documents].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  getDocument(id: number) {
    return documents.find((document) => document.id === id);
  },

  createDocument(input: Omit<DemoDocument, "id" | "number" | "createdAt">) {
    const id = nextDocumentId++;
    const document: DemoDocument = {
      ...input,
      id,
      number: `D-${String(id).padStart(3, "0")}/${new Date().getFullYear()}`,
      createdAt: new Date(),
    };
    documents.push(document);
    return document;
  },

  deleteDocument(id: number) {
    const index = documents.findIndex((document) => document.id === id);
    if (index >= 0) documents.splice(index, 1);
  },

  signDocument(id: number) {
    const document = this.getDocument(id);
    if (!document) return undefined;
    document.status = "signed";
    document.signedAt = new Date();
    return document;
  },

  sendDocumentToSignature(id: number) {
    const document = this.getDocument(id);
    if (!document) return undefined;
    document.status = "pending_signature";
    document.signedAt = undefined;
    return document;
  },

  listCustomTemplates() {
    return [...customTemplates].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  getCustomTemplate(id: number) {
    return customTemplates.find((template) => template.id === id);
  },

  createCustomTemplate(input: Omit<DemoTemplate, "id" | "createdAt">) {
    const template: DemoTemplate = {
      ...input,
      id: nextTemplateId++,
      createdAt: new Date(),
    };
    customTemplates.push(template);
    return template;
  },

  deleteCustomTemplate(id: number) {
    const index = customTemplates.findIndex((template) => template.id === id);
    if (index >= 0) customTemplates.splice(index, 1);
  },
};
