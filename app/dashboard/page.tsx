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
}

export default function Dashboard() {
  const router = useRouter();
  const [editId, setEditId] = useState<number | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [contactFilter, setContactFilter] = useState("");
  const [personFilter, setPersonFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

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
  });

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
    if (Object.values(form).some((v) => !v.trim())) return;

    const countryName =
      countries.find((c) => c.isoCode === form.country)?.name || "";
    const stateName = states.find((s) => s.isoCode === form.state)?.name || "";

    try {
      if (editId) {
        // 🔄 EDIT VISITOR
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
      } else {
        // ➕ ADD VISITOR
        await fetch("/api/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            country: countryName,
            state: stateName,
          }),
        });

        // 📧 EMAIL SEND TO CONTACT PERSON
        await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
          {
            to_email: form.contact_email, // 🔥 jis se milna hai uska email
            name: form.name,
            company: form.company,
            contact_no: form.contact_no,
            purpose: form.purpose,
          },
          process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
        );
      }

      // 🔄 RESET FORM
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
      });

      setEditId(null);
      loadVisitors();

      toast.success(
        editId
          ? "Visitor updated successfully ✅"
          : "Visitor added & email sent ✅"
      );
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Something went wrong ❌");
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
    const matchDate =
      dateFilter === "" ? true : v.created_at.startsWith(dateFilter);
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
          Visitor Dashboard
        </h1>
        <div className="text-center">
          <p className="text-sm font-semibold">Visitor QR</p>
          <QRCodeCanvas
            value="http://172.16.0.133:3000/login?from=qr"
            size={100}
          />
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("isLoggedIn");
            toast.success("Logged out successfully 👋");
            setTimeout(() => {
              router.push("/login");
            }, 1000);
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
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Visitor Form</h3>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Visitor Name */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Visitor Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              placeholder="Enter visitor name"
            />
          </div>

          {/* Company */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Company / Business
            </label>
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              placeholder="Company name"
            />
          </div>

          {/* Country */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Country
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
              State
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
              City
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
              Phone Number
            </label>
            <input
              value={form.contact_no}
              onChange={(e) => setForm({ ...form, contact_no: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              placeholder="e.g. +91 9876543210"
            />
          </div>

          {/* Contact Person */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Contact Person
            </label>
            <input
              value={form.contact_person}
              onChange={(e) =>
                setForm({ ...form, contact_person: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              placeholder="Contact person name"
            />
          </div>

          {/* Contact Person Email */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Contact Person Email
            </label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) =>
                setForm({ ...form, contact_email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              placeholder="email@example.com"
            />
          </div>

          {/* Purpose */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Purpose of Visit
            </label>
            <input
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              placeholder="Reason for visit"
            />
          </div>

          {/* Submit Button */}
          <button className="md:col-span-2 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300">
            {editId ? "Update Visitor" : "Add Visitor"}
          </button>
        </form>
      </section>

      {/* FILTER BAR */}
      <section className="flex flex-col md:flex-row flex-wrap gap-4 mb-6 items-center">
        <input
          placeholder="Filter by Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="flex-1 min-w-[150px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition placeholder-gray-400"
        />
        <input
          placeholder="Filter by Contact No"
          value={contactFilter}
          onChange={(e) => setContactFilter(e.target.value)}
          className="flex-1 min-w-[150px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition placeholder-gray-400"
        />
        <input
          placeholder="Filter by Contact Person"
          value={personFilter}
          onChange={(e) => setPersonFilter(e.target.value)}
          className="flex-1 min-w-[150px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition placeholder-gray-400"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
        />
        <button
          onClick={downloadExcel}
          className="px-5 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
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
