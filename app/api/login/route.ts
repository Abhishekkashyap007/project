import { pool } from "@/db/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { emp_id, password } = await req.json();

    const result = await pool.query(
      `SELECT emp_id, name, department, email
       FROM employees
       WHERE emp_id = $1 AND password = $2`,
      [emp_id, password]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID or Password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: result.rows[0],
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
