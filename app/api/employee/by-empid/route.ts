import { pool } from "@/db/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { emp_id } = await req.json();

  const result = await pool.query(
    "SELECT name, department, email FROM employees WHERE emp_id = $1",
    [emp_id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { message: "Employee not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(result.rows[0]);
}
