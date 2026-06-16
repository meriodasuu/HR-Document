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
  employeeScanDataUrl?: string;
  employeeScanFileName?: string;
  employeeSignedAt?: Date;
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

let nextEmployeeId = 1;
let nextDocumentId = 1;
let nextTemplateId = 1;

const employees: DemoEmployee[] = [];

const documents: DemoDocument[] = [];

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

  attachEmployeeScan(id: number, input: { dataUrl: string; fileName?: string }) {
    const document = this.getDocument(id);
    if (!document) return undefined;
    document.employeeScanDataUrl = input.dataUrl;
    document.employeeScanFileName = input.fileName;
    document.employeeSignedAt = new Date();
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
