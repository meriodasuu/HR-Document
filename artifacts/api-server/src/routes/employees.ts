import { Router, type IRouter } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  UpdateEmployeeBody,
  DeleteEmployeeParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const employees = await db.select().from(employeesTable).orderBy(employeesTable.fullName);
  res.json(
    employees.map((e) => ({
      ...e,
      salary: e.salary ? Number(e.salary) : undefined,
      createdAt: e.createdAt.toISOString(),
    }))
  );
});

router.post("/", async (req, res) => {
  const body = CreateEmployeeBody.parse(req.body);
  const [employee] = await db.insert(employeesTable).values(body).returning();
  res.status(201).json({
    ...employee,
    salary: employee.salary ? Number(employee.salary) : undefined,
    createdAt: employee.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const { id } = GetEmployeeParams.parse({ id: Number(req.params.id) });
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
  if (!employee) return res.status(404).json({ error: "Not found" });
  res.json({
    ...employee,
    salary: employee.salary ? Number(employee.salary) : undefined,
    createdAt: employee.createdAt.toISOString(),
  });
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateEmployeeParams.parse({ id: Number(req.params.id) });
  const body = UpdateEmployeeBody.parse(req.body);
  const [employee] = await db.update(employeesTable).set(body).where(eq(employeesTable.id, id)).returning();
  if (!employee) return res.status(404).json({ error: "Not found" });
  res.json({
    ...employee,
    salary: employee.salary ? Number(employee.salary) : undefined,
    createdAt: employee.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteEmployeeParams.parse({ id: Number(req.params.id) });
  await db.delete(employeesTable).where(eq(employeesTable.id, id));
  res.json({ success: true, message: "Employee deleted" });
});

export default router;
