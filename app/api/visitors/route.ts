import { pool } from "../../../db/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const todayOnly = url.searchParams.get("today") === "true";

  let query = "SELECT * FROM visitors";

  if (todayOnly) {
    query += " WHERE visit_date = CURRENT_DATE";
  }

  query += " ORDER BY created_at DESC";

  const result = await pool.query(query);
  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const {
    name,
    company,
    country,
    state,
    city,
    contact_no,
    contact_person,
    contact_email,
    purpose,
    department,
    visit_date,
  } = await req.json();

  await pool.query(
    `INSERT INTO visitors
   (name, company, country, state, city, contact_no,
    contact_person, contact_person_email, purpose, department, visit_date)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      name,
      company,
      country,
      state,
      city,
      contact_no,
      contact_person,
      contact_email,
      purpose,
      department,
      visit_date, // 👈 NEW
    ]
  );

  return NextResponse.json({ success: true });
}
