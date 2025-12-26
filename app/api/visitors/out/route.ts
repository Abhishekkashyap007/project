import { pool } from "../../../../db/client";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const { id } = await req.json();

  await pool.query("UPDATE visitors SET out_time = NOW() WHERE id = $1", [id]);

  return NextResponse.json({ success: true });
}
