import { pool } from "../../../../db/client";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    const {
      id,
      name,
      company,
      country,
      state,
      city,
      contact_no,
      contact_person,
      contact_email,
      purpose,
    } = await req.json();

    await pool.query(
      `
      UPDATE visitors SET
        name = $1,
        company = $2,
        country = $3,
        state = $4,
        city = $5,
        contact_no = $6,
        contact_person = $7,
        contact_person_email = $8,
        purpose = $9
      WHERE id = $10
      `,
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
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Edit Visitor Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update visitor" },
      { status: 500 }
    );
  }
}
