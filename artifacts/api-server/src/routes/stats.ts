import { Router, type IRouter } from "express";
import { db, documentsTable, employeesTable } from "@workspace/db";
import { eq, sql, and, gte } from "drizzle-orm";
import { demoStore } from "../lib/demo-store";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (demoStore.isEnabled) {
    const allDocs = demoStore.listDocuments();
    const allEmps = demoStore.listEmployees();

    return res.json({
      totalDocuments: allDocs.length,
      draftDocuments: allDocs.filter((d) => d.status === "draft").length,
      signedDocuments: allDocs.filter((d) => d.status === "signed").length,
      printedDocuments: allDocs.filter((d) => d.status === "printed").length,
      totalEmployees: allEmps.length,
      documentsThisMonth: allDocs.filter((d) => d.createdAt >= firstOfMonth).length,
    });
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  const allDocs = await db.select().from(documentsTable);
  const allEmps = await db.select({ id: employeesTable.id }).from(employeesTable);

  const totalDocuments = allDocs.length;
  const draftDocuments = allDocs.filter((d) => d.status === "draft").length;
  const signedDocuments = allDocs.filter((d) => d.status === "signed").length;
  const printedDocuments = allDocs.filter((d) => d.status === "printed").length;
  const totalEmployees = allEmps.length;
  const documentsThisMonth = allDocs.filter((d) => d.createdAt >= firstOfMonth).length;

  res.json({
    totalDocuments,
    draftDocuments,
    signedDocuments,
    printedDocuments,
    totalEmployees,
    documentsThisMonth,
  });
});

export default router;
