import { Router, type Request, type Response } from "express";
import { db, documentsTable, employeesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  CreateDocumentBody,
  GetDocumentParams,
  DeleteDocumentParams,
  SignDocumentParams,
  GetDocumentsQueryParams,
} from "@workspace/api-zod";
import { STATIC_TEMPLATES } from "./templates";
import { customTemplatesTable } from "@workspace/db";
import { demoStore, type DemoDocument } from "../lib/demo-store";

const router = Router();

function fillTemplate(content: string, fields: Record<string, string>, employee: { fullName: string; position: string; department: string }): string {
  let result = content
    .replace(/\{\{employeeName\}\}/g, employee.fullName)
    .replace(/\{\{position\}\}/g, employee.position)
    .replace(/\{\{department\}\}/g, employee.department);

  for (const [key, value] of Object.entries(fields)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  // Handle optional blocks {{#key}}...{{/key}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_match: string, key: string, block: string) => {
    return fields[key] ? block.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), fields[key]) : "";
  });

  return result;
}

function generateDocNumber(type: string, id: number): string {
  const year = new Date().getFullYear();
  const prefix: Record<string, string> = {
    order_hire: "П",
    order_dismiss: "У",
    contract: "ТД",
    order_transfer: "ПР",
    order_vacation: "О",
    act: "А",
  };
  return `${prefix[type] || "Д"}-${String(id).padStart(3, "0")}/${year}`;
}

function serializeDocument<T extends { signedAt?: Date | null; employeeSignedAt?: Date | null; createdAt: Date }>(doc: T, employeeName: string) {
  return {
    ...doc,
    employeeName,
    createdAt: doc.createdAt.toISOString(),
    employeeSignedAt: doc.employeeSignedAt?.toISOString(),
    signedAt: doc.signedAt?.toISOString(),
  };
}

function getUserRole(req: Request & { user?: { role?: string } }) {
  return req.user?.role;
}

router.get("/", async (req: Request, res: Response) => {
  const query = GetDocumentsQueryParams.parse(req.query);

  if (demoStore.isEnabled) {
    let result = demoStore.listDocuments().map((doc) =>
      serializeDocument(doc, demoStore.getEmployee(doc.employeeId)?.fullName ?? ""),
    );

    if (query.type) result = result.filter((d) => d.type === query.type);
    if (query.status) result = result.filter((d) => d.status === query.status);
    if (query.employeeId) result = result.filter((d) => d.employeeId === Number(query.employeeId));

    return res.json(result);
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  const rows = await db
    .select({
      doc: documentsTable,
      emp: { fullName: employeesTable.fullName },
    })
    .from(documentsTable)
    .innerJoin(employeesTable, eq(documentsTable.employeeId, employeesTable.id))
    .orderBy(sql`${documentsTable.createdAt} DESC`);

  let result = rows.map((r) => ({
    ...r.doc,
    employeeName: r.emp.fullName,
    createdAt: r.doc.createdAt.toISOString(),
    employeeSignedAt: r.doc.employeeSignedAt?.toISOString(),
    signedAt: r.doc.signedAt?.toISOString(),
  }));

  if (query.type) result = result.filter((d) => d.type === query.type);
  if (query.status) result = result.filter((d) => d.status === query.status);
  if (query.employeeId) result = result.filter((d) => d.employeeId === Number(query.employeeId));

  res.json(result);
});

router.post("/", async (req: Request, res: Response) => {
  const body = CreateDocumentBody.parse(req.body);

  let template: { name: string; type: string; content: string } | undefined;

  if (body.templateId > 1000) {
    const dbId = body.templateId - 1000;
    if (demoStore.isEnabled) {
      const row = demoStore.getCustomTemplate(dbId);
      if (row) template = { name: row.name, type: row.type, content: row.content };
    } else {
      if (!db) return res.status(503).json({ error: "Database is not configured" });
      const [row] = await db.select().from(customTemplatesTable).where(eq(customTemplatesTable.id, dbId));
      if (row) template = { name: row.name, type: row.type, content: row.content };
    }
  } else {
    template = STATIC_TEMPLATES.find((t) => t.id === body.templateId);
  }

  if (!template) return res.status(400).json({ error: "Template not found" });

  if (demoStore.isEnabled) {
    const employee = demoStore.getEmployee(body.employeeId);
    if (!employee) return res.status(400).json({ error: "Employee not found" });

    const content = fillTemplate(template.content, body.fields as Record<string, string>, {
      fullName: employee.fullName,
      position: employee.position,
      department: employee.department,
    });

    const doc = demoStore.createDocument({
      type: template.type,
      title: template.name,
      status: "draft",
      employeeId: body.employeeId,
      content,
      templateId: body.templateId,
    });

    return res.status(201).json(serializeDocument(doc, employee.fullName));
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, body.employeeId));
  if (!employee) return res.status(400).json({ error: "Employee not found" });

  const content = fillTemplate(template.content, body.fields as Record<string, string>, {
    fullName: employee.fullName,
    position: employee.position,
    department: employee.department,
  });

  const [doc] = await db
    .insert(documentsTable)
    .values({
      number: "TEMP",
      type: template.type,
      title: template.name,
      status: "draft",
      employeeId: body.employeeId,
      content,
      templateId: body.templateId,
    })
    .returning();

  const finalNumber = generateDocNumber(template.type, doc.id);
  const [updated] = await db.update(documentsTable).set({ number: finalNumber }).where(eq(documentsTable.id, doc.id)).returning();

  res.status(201).json({
    ...updated,
    employeeName: employee.fullName,
    createdAt: updated.createdAt.toISOString(),
    employeeSignedAt: updated.employeeSignedAt?.toISOString(),
    signedAt: updated.signedAt?.toISOString(),
  });
});

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = GetDocumentParams.parse({ id: Number(req.params.id) });

  if (demoStore.isEnabled) {
    const doc = demoStore.getDocument(id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    return res.json(serializeDocument(doc, demoStore.getEmployee(doc.employeeId)?.fullName ?? ""));
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  const rows = await db
    .select({
      doc: documentsTable,
      emp: { fullName: employeesTable.fullName },
    })
    .from(documentsTable)
    .innerJoin(employeesTable, eq(documentsTable.employeeId, employeesTable.id))
    .where(eq(documentsTable.id, id));

  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  const r = rows[0];
  res.json({
    ...r.doc,
    employeeName: r.emp.fullName,
    createdAt: r.doc.createdAt.toISOString(),
    employeeSignedAt: r.doc.employeeSignedAt?.toISOString(),
    signedAt: r.doc.signedAt?.toISOString(),
  });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = DeleteDocumentParams.parse({ id: Number(req.params.id) });

  if (demoStore.isEnabled) {
    demoStore.deleteDocument(id);
    return res.json({ success: true, message: "Document deleted" });
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.json({ success: true, message: "Document deleted" });
});

router.post("/:id/send-signature", async (req: Request, res: Response) => {
  if (getUserRole(req) !== "hr") {
    return res.status(403).json({ error: "Only HR can send documents for signature" });
  }

  return res.status(400).json({
    error: "Upload the employee-signed scanned document before sending it to the director",
  });
});

router.post("/:id/employee-scan", async (req: Request, res: Response) => {
  if (getUserRole(req) !== "hr") {
    return res.status(403).json({ error: "Only HR can upload employee signed scans" });
  }

  const { id } = SignDocumentParams.parse({ id: Number(req.params.id) });
  const { scanDataUrl, fileName } = req.body ?? {};

  if (typeof scanDataUrl !== "string" || !scanDataUrl.startsWith("data:")) {
    return res.status(400).json({ error: "Upload a scanned document file" });
  }

  if (scanDataUrl.length > 6_000_000) {
    return res.status(413).json({ error: "Scanned document file is too large" });
  }

  const employeeSignedAt = new Date();

  if (demoStore.isEnabled) {
    const current = demoStore.getDocument(id);
    if (!current) return res.status(404).json({ error: "Not found" });
    if (current.status !== "draft") {
      return res.status(400).json({ error: "Only draft documents can receive an employee signed scan" });
    }
    const updated = demoStore.attachEmployeeScan(id, {
      dataUrl: scanDataUrl,
      fileName: typeof fileName === "string" ? fileName : undefined,
    })!;
    return res.json(serializeDocument(updated, demoStore.getEmployee(updated.employeeId)?.fullName ?? ""));
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  const [doc] = await db
    .update(documentsTable)
    .set({
      status: "pending_signature",
      employeeScanDataUrl: scanDataUrl,
      employeeScanFileName: typeof fileName === "string" ? fileName : null,
      employeeSignedAt,
      signedAt: null,
    })
    .where(and(eq(documentsTable.id, id), eq(documentsTable.status, "draft")))
    .returning();

  if (!doc) return res.status(404).json({ error: "Draft document not found" });

  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, doc.employeeId));

  res.json(serializeDocument(doc, employee?.fullName ?? ""));
});

router.post("/:id/sign", async (req: Request, res: Response) => {
  if (getUserRole(req) !== "director") {
    return res.status(403).json({ error: "Only director can sign documents" });
  }

  const { id } = SignDocumentParams.parse({ id: Number(req.params.id) });

  if (demoStore.isEnabled) {
    const current = demoStore.getDocument(id);
    if (!current) return res.status(404).json({ error: "Not found" });
    if (current.status !== "pending_signature") {
      return res.status(400).json({ error: "Document must be sent for signature first" });
    }
    if (!current.employeeScanDataUrl) {
      return res.status(400).json({ error: "Employee-signed scan is required before director signature" });
    }
    const doc = demoStore.signDocument(id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    return res.json(serializeDocument(doc, demoStore.getEmployee(doc.employeeId)?.fullName ?? ""));
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  const [doc] = await db
    .update(documentsTable)
    .set({ status: "signed", signedAt: new Date() })
    .where(and(
      eq(documentsTable.id, id),
      eq(documentsTable.status, "pending_signature"),
      sql`${documentsTable.employeeScanDataUrl} IS NOT NULL`,
    ))
    .returning();

  if (!doc) return res.status(404).json({ error: "Employee-signed scanned document pending signature not found" });

  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, doc.employeeId));

  res.json({
    ...doc,
    employeeName: employee?.fullName ?? "",
    createdAt: doc.createdAt.toISOString(),
    employeeSignedAt: doc.employeeSignedAt?.toISOString(),
    signedAt: doc.signedAt?.toISOString(),
  });
});

export default router;
