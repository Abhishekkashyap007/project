"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Country, State, City } from "country-state-city";
import emailjs from "emailjs-com";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ---------- TYPES ---------- */
interface Visitor {
  id: number;
  name: string;
  company: string;
  country: string;
  state: string;
  city: string;
  contact_no: string;
  contact_person: string;
  contact_person_email: string;
  purpose: string;
  created_at: string;
  out_time: string | null;
  department: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [editId, setEditId] = useState<number | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [contactFilter, setContactFilter] = useState("");
  const [personFilter, setPersonFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  /* ---------- FORM STATE ---------- */
  const [form, setForm] = useState({
    name: "",
    company: "",
    country: "",
    state: "",
    city: "",
    contact_no: "",
    contact_person: "",
    contact_email: "",
    purpose: "",
    department: "",
    emp_id: "",
    emp_name: "",
    visit_date: "",
  });

  /* 📇 FETCH EMPLOYEE DETAILS */
  const fetchEmployee = async (empId: string) => {
    if (!empId || empId.length < 3) {
      setForm((prev) => ({
        ...prev,
        emp_name: "",
        department: "",
        contact_email: "",
      }));
      return;
    }

    try {
      const res = await fetch("/api/employee/by-empid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emp_id: empId }),
      });

      if (!res.ok) {
        setForm((prev) => ({
          ...prev,
          emp_name: "",
          department: "",
          contact_email: "",
        }));
        return;
      }

      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        emp_name: data.name,
        department: data.department,
        contact_email: data.email,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  /* 🌍 COUNTRY / STATE / CITY DATA */
  const countries = Country.getAllCountries();
  const states = form.country ? State.getStatesOfCountry(form.country) : [];
  const cities = form.state
    ? City.getCitiesOfState(form.country, form.state)
    : [];

  /* 🔐 LOGIN CHECK */
  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      router.push("/login");
    }
  }, [router]);

  /* 📥 LOAD VISITORS */
  const loadVisitors = async () => {
    const res = await fetch("/api/visitors");
    if (res.ok) setVisitors(await res.json());
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  /* ➕ ADD VISITOR */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.company ||
      !form.contact_no ||
      !form.purpose ||
      !form.emp_id
    ) {
      toast.error("Please fill all required fields ❌");
      return;
    }

    setLoading(true);

    const countryName =
      countries.find((c) => c.isoCode === form.country)?.name || "";
    const stateName = states.find((s) => s.isoCode === form.state)?.name || "";

    try {
      if (editId) {
        await fetch("/api/visitors/edit", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            ...form,
            country: countryName,
            state: stateName,
          }),
        });

        toast.success("Visitor updated successfully ✅");
      } else {
        await fetch("/api/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            company: form.company,
            country: countryName,
            state: stateName,
            city: form.city,
            contact_no: form.contact_no,
            contact_person: form.emp_name,
            contact_email: form.contact_email,
            purpose: form.purpose,
            department: form.department,
            visit_date:
              form.visit_date || new Date().toISOString().split("T")[0],
          }),
        });

        toast.success("Visitor added successfully ✅");

        // 📧 EMAIL – BACKGROUND (NO UI BLOCK)
        emailjs
          .send(
            process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
            process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
            {
              to_email: form.contact_email,
              name: form.name,
              company: form.company,
              contact_no: form.contact_no,
              purpose: form.purpose,
            },
            process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
          )
          .catch(() => {
            toast.warn("Visitor added but email failed ⚠️");
          });
      }

      setForm({
        name: "",
        company: "",
        country: "",
        state: "",
        city: "",
        contact_no: "",
        contact_person: "",
        contact_email: "",
        purpose: "",
        department: "",
        emp_id: "",
        emp_name: "",
        visit_date: "",
      });

      setEditId(null);
      loadVisitors();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (form.contact_no.length < 5) return;

    const found = visitors.find((v) => v.contact_no === form.contact_no);

    if (found) {
      setForm({
        name: found.name,
        company: found.company,
        country: found.country,
        state: found.state,
        city: found.city,
        contact_no: found.contact_no,
        contact_person: found.contact_person,
        contact_email: found.contact_person_email,
        purpose: found.purpose,
        department: found.department,
        emp_id: "",
        emp_name: "",
        visit_date: "",
      });
      setEditId(found.id); // edit mode ON
    }
  }, [form.contact_no]);
  useEffect(() => {
    const openForm = localStorage.getItem("openVisitorForm");

    if (openForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
      localStorage.removeItem("openVisitorForm");
    }
  }, []);
  /* 🚪 MARK VISITOR OUT */
  const markOut = async (id: number) => {
    await fetch("/api/visitors/out", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadVisitors();
  };

  /* 🔎 FILTER */
  const filtered = visitors.filter((v) => {
    const matchName = v.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchContact = v.contact_no.includes(contactFilter);
    const matchPerson = v.contact_person
      .toLowerCase()
      .includes(personFilter.toLowerCase());

    const matchDate = (() => {
      if (!fromDate && !toDate) return true;

      const visitDate = new Date(v.created_at);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate + "T23:59:59") : null;

      if (from && to) return visitDate >= from && visitDate <= to;
      if (from) return visitDate >= from;
      if (to) return visitDate <= to;

      return true;
    })();

    return matchName && matchContact && matchPerson && matchDate;
  });

  /* 📊 EXCEL */
  const downloadExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Visitors");
    XLSX.writeFile(wb, "visitors.xlsx");
  };

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-teal-100 via-white to-blue-100">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 p-4 bg-white shadow-lg rounded-xl gap-4 md:gap-0">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-green-500 to-emerald-600 drop-shadow-lg">
          VISITOR FORM
        </h1>
        {/* <div className="text-center">
          <p className="text-sm font-semibold">Visitor QR</p>
          <QRCodeCanvas
            value="http://172.16.0.133:3000/login?from=qr"
            size={100}
          />
        </div> */}
        <button
          onClick={() => {
            localStorage.removeItem("isLoggedIn");
            toast.success("Logged out successfully 👋");
            setTimeout(() => {
              router.push("/login");
            }, 500);
          }}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h8a1 1 0 110 2H5v10h7a1 1 0 110 2H4a1 1 0 01-1-1V4zm12.707.293a1 1 0 010 1.414L15.414 7H9a1 1 0 110-2h6.414l.293-.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Logout
        </button>
      </header>

      {/* ADD VISITOR */}
      <section
        ref={formRef}
        className="bg-gradient-to-r from-white/80 to-gray-100/80 backdrop-blur-md rounded-2xl p-6 mb-6 shadow-lg"
      >
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Visitor Name */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              VISITOR NAME
            </label>
            <input
              value={form.name}
              onChange={(e) => {
                const value = e.target.value;

                const formatted = value
                  .split(" ")
                  .map((word) =>
                    word.length > 0
                      ? word.charAt(0).toUpperCase() + word.slice(1)
                      : ""
                  )
                  .join(" ");

                setForm({ ...form, name: formatted });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Enter visitor name"
            />
          </div>

          {/* Company */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              COMPANY / BUSINESS
            </label>
            <input
              value={form.company}
              onChange={(e) => {
                const value = e.target.value;

                const formatted = value
                  .split(" ")
                  .map((word) =>
                    word.length > 0
                      ? word.charAt(0).toUpperCase() + word.slice(1)
                      : ""
                  )
                  .join(" ");

                setForm({ ...form, company: formatted });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Company name"
            />
          </div>

          {/* Country */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              COUNTRY
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              value={form.country}
              onChange={(e) =>
                setForm({
                  ...form,
                  country: e.target.value,
                  state: "",
                  city: "",
                })
              }
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.isoCode} value={c.isoCode}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              STATE
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              value={form.state}
              disabled={!form.country}
              onChange={(e) =>
                setForm({ ...form, state: e.target.value, city: "" })
              }
            >
              <option value="">Select State</option>
              {states.map((s) => (
                <option key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              CITY
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              value={form.city}
              disabled={!form.state}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            >
              <option value="">Select City</option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Number */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              VISITOR NUMBER
            </label>
            <input
              type="text"
              value={form.contact_no}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, "");
                if (onlyDigits.length <= 10) {
                  setForm({ ...form, contact_no: onlyDigits });
                }
              }}
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"
              placeholder="Enter the number"
            />
          </div>

          {/* Employee ID */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              EMPLOYEE ID (Whom to Meet)
            </label>

            <input
              value={form.emp_id}
              onChange={(e) => {
                const empId = e.target.value;
                setForm({ ...form, emp_id: empId });
                fetchEmployee(empId);
              }}
              placeholder="Enter Employee ID (e.g. EMP001)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Employee Name */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              EMPLOYEE NAME
            </label>

            <input
              value={form.emp_name}
              readOnly
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
              placeholder="Auto-filled"
            />
          </div>

          {/* Contact Person Email */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              EMPLOYEE EMAIL
            </label>
            <input
              type="email"
              value={form.contact_email}
              readOnly
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
              placeholder="Auto-filled"
            />
          </div>

          {/* Department */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              DEPARTMENT
            </label>
            <input
              value={form.department}
              readOnly
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
              placeholder="Auto-filled"
            />
          </div>

          {/* Purpose */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              PURPOSE OF VISIT
            </label>
            <input
              value={form.purpose}
              onChange={(e) => {
                const value = e.target.value;

                const formatted = value
                  .split(" ")
                  .map((word) =>
                    word.length > 0
                      ? word.charAt(0).toUpperCase() + word.slice(1)
                      : ""
                  )
                  .join(" ");

                setForm({ ...form, purpose: formatted });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Reason for visit"
            />
          </div>

          {/* Visit Date */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              FUTURE VISIT DATE (Optional)
            </label>

            <input
              type="date"
              value={form.visit_date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* Submit Button */}
          <button
            disabled={loading}
            className={`md:col-span-2 py-3 text-white font-semibold rounded-xl shadow-md transition-all duration-300
    ${
      loading
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-gradient-to-r from-green-500 to-blue-500 hover:scale-105 hover:shadow-lg"
    }`}
          >
            {loading
              ? "PROCESSING..."
              : editId
              ? "UPDATE VISITOR"
              : "ADD VISITOR"}
          </button>
        </form>
      </section>

      {/* FILTER BAR */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 items-end">
        <input
          placeholder="Search by Visitor Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
        />

        <input
          placeholder="Search by Contact No"
          value={contactFilter}
          onChange={(e) => setContactFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
        />

        <input
          placeholder="Search by Contact Person"
          value={personFilter}
          onChange={(e) => setPersonFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
        />

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"
        />

        <button
          onClick={downloadExcel}
          className="w-full px-5 py-2.5 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg shadow-md hover:scale-105 hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          ⬇ Excel
        </button>
      </section>

      {/* TABLE */}
      <section className="bg-white rounded-2xl shadow-lg p-4 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gradient-to-r from-teal-200 to-teal-300 rounded-t-xl">
            <tr>
              {[
                "S.No",
                "Name",
                "Company/Business",
                "Country",
                "State",
                "City",
                "Contact",
                "Email",
                "Person",
                "Purpose",
                "Department",
                "IN-Time",
                "OUT",
                "Edit",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-gray-700 font-semibold tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.map((v, index) => (
              <tr
                key={v.id}
                className="hover:bg-teal-50 transition-colors duration-200 even:bg-gray-50"
              >
                <td className="px-4 py-2 font-semibold">{index + 1}</td>
                <td className="px-4 py-2">{v.name}</td>
                <td className="px-4 py-2">{v.company}</td>
                <td className="px-4 py-2">{v.country}</td>
                <td className="px-4 py-2">{v.state}</td>
                <td className="px-4 py-2">{v.city}</td>
                <td className="px-4 py-2">{v.contact_no}</td>
                <td className="px-4 py-2">{v.contact_person_email}</td>
                <td className="px-4 py-2">{v.contact_person}</td>
                <td className="px-4 py-2">{v.purpose}</td>
                <td className="px-4 py-2">{v.department}</td>
                <td className="px-4 py-2">
                  {new Date(v.created_at).toLocaleString()}
                </td>

                {/* OUT COLUMN */}
                <td className="px-4 py-2">
                  {v.out_time ? (
                    <span className="text-green-600 font-semibold">
                      {new Date(v.out_time).toLocaleTimeString()}
                    </span>
                  ) : (
                    <button
                      onClick={() => markOut(v.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md text-sm shadow hover:bg-red-600 hover:scale-105 transition-all duration-200"
                    >
                      OUT
                    </button>
                  )}
                </td>

                {/* EDIT BUTTON */}
                <td className="px-4 py-2">
                  <button
                    onClick={() => {
                      setEditId(v.id);
                      setForm({
                        name: v.name,
                        company: v.company,
                        country: v.country,
                        state: v.state,
                        city: v.city,
                        contact_no: v.contact_no,
                        contact_person: v.contact_person,
                        contact_email: v.contact_person_email,
                        purpose: v.purpose,
                        department: v.department,
                        emp_id: "",
                        emp_name: "",
                        visit_date: "",
                      });
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 hover:scale-105 transition-all duration-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </main>
  );
}
