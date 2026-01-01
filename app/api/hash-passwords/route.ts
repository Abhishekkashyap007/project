// import { NextResponse } from "next/server";
// // import bcrypt from "bcrypt";
// import {pool} from "@/db/client";

// export async function GET() {
//   try {
//     // sirf un rows ko uthao jinka password plain hai
//     const result = await pool.query(
//       "SELECT emp_id, password FROM employee"
//     );

//     for (const emp of result.rows) {
//       // already hashed ho to skip
//       if (emp.password?.startsWith("$2b$")) continue;

//       const hashedPassword = await bcrypt.hash(emp.password, 10);

//       await pool.query(
//         "UPDATE employee SET password = $1 WHERE emp_id = $2",
//         [hashedPassword, emp.emp_id]
//       );
//     }

//     return NextResponse.json({ success: true, message: "Passwords hashed" });
//   } catch (error) {
//     console.error("HASH ERROR 👉", error);
//     return NextResponse.json(
//       { success: false, error: "Hashing failed" },
//       { status: 500 }
//     );
//   }
// }
