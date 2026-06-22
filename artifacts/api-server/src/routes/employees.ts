import { Router, type Request, type Response } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  CreateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  UpdateEmployeeBody,
  DeleteEmployeeParams,
} from "@workspace/api-zod";
import { demoStore } from "../lib/demo-store";

const router = Router();

type EmployeeInput = z.infer<typeof CreateEmployeeBody>;

type EmployeeLike = {
  id: number;
  fullName: string;
  position: string;
  department: string;
  employeeNumber: string;
  hireDate: string;
  salary?: string | number | null;
  phone?: string | null;
  email?: string | null;
  createdAt: Date;
};

type EmployeeResponse = Omit<EmployeeLike, "salary" | "createdAt"> & {
  salary?: number;
  createdAt: string;
};

function serializeEmployee(employee: EmployeeLike): EmployeeResponse {
  return {
    ...employee,
    salary: employee.salary === undefined || employee.salary === null ? undefined : Number(employee.salary),
    createdAt: employee.createdAt.toISOString(),
  };
}

function toDbEmployeeInput(body: EmployeeInput) {
  return {
    ...body,
    salary: body.salary === undefined ? undefined : String(body.salary),
  };
}

router.get("/", async (_req: Request, res: Response) => {
  if (demoStore.isEnabled) {
    return res.json(demoStore.listEmployees().map(serializeEmployee));
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  const employees = await db.select().from(employeesTable).orderBy(employeesTable.fullName);
  res.json(employees.map(serializeEmployee));
});

router.post("/", async (req: Request, res: Response) => {
  const body = CreateEmployeeBody.parse(req.body);

  if (demoStore.isEnabled) {
    return res.status(201).json(serializeEmployee(demoStore.createEmployee(body)));
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  const [employee] = await db.insert(employeesTable).values(toDbEmployeeInput(body)).returning();
  res.status(201).json(serializeEmployee(employee));
});

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = GetEmployeeParams.parse({ id: Number(req.params.id) });

  if (demoStore.isEnabled) {
    const employee = demoStore.getEmployee(id);
    if (!employee) return res.status(404).json({ error: "Not found" });
    return res.json(serializeEmployee(employee));
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
  if (!employee) return res.status(404).json({ error: "Not found" });
  res.json(serializeEmployee(employee));
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = UpdateEmployeeParams.parse({ id: Number(req.params.id) });
  const body = UpdateEmployeeBody.parse(req.body);

  if (demoStore.isEnabled) {
    const employee = demoStore.updateEmployee(id, body);
    if (!employee) return res.status(404).json({ error: "Not found" });
    return res.json(serializeEmployee(employee));
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  const [employee] = await db.update(employeesTable).set(toDbEmployeeInput(body)).where(eq(employeesTable.id, id)).returning();
  if (!employee) return res.status(404).json({ error: "Not found" });
  res.json(serializeEmployee(employee));
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = DeleteEmployeeParams.parse({ id: Number(req.params.id) });

  if (demoStore.isEnabled) {
    demoStore.deleteEmployee(id);
    return res.json({ success: true, message: "Employee deleted" });
  }

  if (!db) return res.status(503).json({ error: "Database is not configured" });

  await db.delete(employeesTable).where(eq(employeesTable.id, id));
  res.json({ success: true, message: "Employee deleted" });
});

export default router;
