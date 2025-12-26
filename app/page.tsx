"use client";

import { useEffect, useState, useRef } from "react";

interface Visitor {
  id: number;
  name: string;
  company: string;
  country: string;
  state: string;
  city: string;
  contact_no: string;
  contact_person: string;
  purpose: string;
  created_at: string;
  out_time?: string | null;
}

export default function Home() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ================= LOAD TODAY VISITORS ================= */
  const loadVisitors = async () => {
    try {
      const res = await fetch("/api/visitors?today=true");
      if (res.ok) {
        const data = await res.json();
        setVisitors(data);
      }
    } catch (err) {
      console.error("Failed to load visitors", err);
    }
  };

  useEffect(() => {
    loadVisitors();
    const interval = setInterval(loadVisitors, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationId: number;
    const speed = 0.25;

    const scroll = () => {
      if (!container) return;
      container.scrollTop += speed;

      if (
        container.scrollTop + container.clientHeight >=
        container.scrollHeight
      ) {
        container.scrollTop = 0;
      }

      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-slate-100 via-white to-emerald-100 text-base">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200">
        <div
          className="px-4 md:px-6 py-3 md:py-4
                  flex flex-col md:flex-row
                  items-center md:items-center
                  relative gap-3 md:gap-0"
        >
          {/* ===== LOGO ===== */}
          <img
            src="/Logo.png"
            alt="Naini Papers"
            className="h-12 md:h-17 rounded-lg
                 md:absolute md:left-6"
          />

          {/* ===== TITLE ===== */}
          <div className="text-center md:absolute md:left-1/2 md:-translate-x-1/2">
            <h1
              className="text-xl md:text-3xl font-extrabold
                     bg-gradient-to-r from-orange-500 via-green-500 to-emerald-600
                     bg-clip-text text-transparent tracking-wide"
            >
              Naini Papers Limited
            </h1>
            <p className="text-xs md:text-sm font-semibold text-gray-700 mt-1">
              Ethically Firm &amp; Environmentally Strong
            </p>
          </div>

          {/* ===== BUTTONS ===== */}
          <div
            className="flex flex-wrap justify-center gap-2 md:gap-4
                    md:ml-auto md:mt-0 mt-2"
          >
            <a
              href="http://192.168.4.5:5555/"
              target="_blank"
              className="px-4 md:px-5 py-2 rounded-lg
                   bg-blue-600 text-white
                   text-xs md:text-sm font-semibold
                   shadow hover:scale-105 transition"
            >
              IT Portal
            </a>
            <a
              href="http://localhost:80/"
              className="px-4 md:px-5 py-2 rounded-lg
                   bg-green-600 text-white
                   text-xs md:text-sm font-semibold
                   shadow hover:scale-105 transition"
            >
              HR Portal
            </a>
            <a
              href="/login"
              className="px-4 md:px-5 py-2 rounded-lg
                   bg-gradient-to-r from-orange-500 to-amber-500
                   text-white text-xs md:text-sm font-bold
                   shadow hover:scale-105 transition"
            >
              Visitor Login
            </a>
          </div>
        </div>
      </header>

      {/* ================= VISITOR LIST ================= */}
      <section className="flex-1 px-3 md:px-6 py-4 md:py-6">
        <h2 className="text-xl md:text-2xl font-bold text-center text-teal-700 mb-5 md:mb-6 tracking-wide">
          Live Visitor Tracker
        </h2>

        <div className="bg-white shadow-lg border border-teal-100 overflow-hidden">
          <div
            ref={scrollRef}
            className="h-[calc(100vh-260px)] overflow-x-auto"
          >
            <table className="min-w-[1100px] md:min-w-full border-collapse text-sm md:text-base">
              {/* ===== TABLE HEADER ===== */}
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-teal-200 to-teal-300">
                <tr className="text-gray-700 font-semibold tracking-wide text-left">
                  <th className="px-4 py-3">S.No</th>
                  <th className="px-4 py-3">Visitor Name</th>
                  <th className="px-4 py-3">Company / Business</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">In Time</th>
                  <th className="px-4 py-3">Out Time</th>
                </tr>
              </thead>

              {/* ===== TABLE BODY ===== */}
              <tbody>
                {visitors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-10 text-center text-gray-500 font-semibold"
                    >
                      No visitors today
                    </td>
                  </tr>
                ) : (
                  visitors.map((v, i) => {
                    const inTime = new Date(v.created_at).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );

                    const outTime = v.out_time
                      ? new Date(v.out_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-";

                    return (
                      <tr
                        key={v.id}
                        className="even:bg-gray-50 hover:bg-teal-50 transition-colors duration-200"
                      >
                        <td className="px-4 py-2 font-semibold">{i + 1}</td>
                        <td className="px-4 py-2 font-semibold text-teal-800">
                          {v.name}
                        </td>
                        <td className="px-4 py-2">{v.company}</td>
                        <td className="px-4 py-2">{v.city}</td>
                        <td className="px-4 py-2">{v.state}</td>
                        <td className="px-4 py-2">{v.country}</td>
                        <td className="px-4 py-2 font-semibold text-indigo-700">
                          {v.contact_no}
                        </td>
                        <td className="px-4 py-2">{v.contact_person}</td>
                        <td className="px-4 py-2">{v.purpose}</td>
                        <td className="px-4 py-2 font-semibold text-teal-700">
                          {inTime}
                        </td>
                        <td
                          className={`px-4 py-2 font-semibold ${
                            outTime === "-" ? "text-gray-400" : "text-red-600"
                          }`}
                        >
                          {outTime}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner text-center py-3 text-xs md:text-sm font-medium border-t border-gray-200">
        <span className="text-gray-700">Managed & Maintained by </span>
        <span className="font-semibold text-emerald-700">Amit Srivastava</span>
        <span className="text-gray-700"> | Sr. Manager (IT)</span>
      </footer>
    </main>
  );
}
