// /app/login/LoginClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginClient() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === "Gate2" && password === "gate1234") {
      localStorage.setItem("isLoggedIn", "true");

      const from = searchParams.get("from");

      if (from === "qr") {
        localStorage.setItem("openVisitorForm", "true");
      }

      toast.success("Login Successfully ✅", { autoClose: 1500 });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } else {
      toast.error("Invalid Login ID or Password ❌", { autoClose: 1500 });
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4
  bg-gradient-to-br from-emerald-50 via-sky-50 to-teal-100
  relative overflow-hidden"
    >
      {/* ===== BACKGROUND BLOBS ===== */}
      <div className="absolute -top-40 -left-40 w-[28rem] h-[28rem] bg-emerald-300 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute top-1/4 -right-40 w-[28rem] h-[28rem] bg-sky-300 rounded-full blur-3xl opacity-20"></div>

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        {/* ===== HEADER ===== */}
        <header className="flex flex-col items-center mb-8">
          <div className="bg-white p-3 rounded-xl shadow-lg hover:shadow-xl transition">
            <img
              src="/Logo.png"
              alt="Naini Papers Logo"
              className="h-20 sm:h-24 rounded-lg"
            />
          </div>

          <h1
            className="mt-4 text-2xl sm:text-3xl font-extrabold text-center
        bg-gradient-to-r from-orange-500 via-green-500 to-green-600
        bg-clip-text text-transparent"
          >
            Naini Papers Limited
          </h1>

          <p className="mt-2 text-sm sm:text-base font-medium text-gray-700 text-center">
            Ethically Firm and Environmentally Strong
          </p>
        </header>

        {/* ===== LOGIN FORM ===== */}
        <form
          onSubmit={handleLogin}
          autoComplete="off"
          className="bg-white/85 backdrop-blur-xl p-6 sm:p-8 rounded-2xl
      shadow-xl hover:shadow-2xl transition"
        >
          <input
            type="text"
            placeholder="Login ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 sm:p-4 mb-4 rounded-lg border border-green-200
        text-sm sm:text-base outline-none bg-green-50
        focus:ring-2 focus:ring-green-400 transition"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 sm:p-4 mb-5 rounded-lg border border-green-200
        text-sm sm:text-base outline-none bg-green-50
        focus:ring-2 focus:ring-green-400 transition"
          />

          <button
            type="submit"
            className="w-full py-3 sm:py-4
        bg-gradient-to-r from-green-600 to-emerald-500
        text-white font-bold text-base sm:text-lg
        rounded-lg shadow-md
        hover:shadow-lg hover:scale-[1.03]
        transition-all duration-200"
          >
            Login
          </button>

          {/* Home Button */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full mt-3 py-3 rounded-lg
        bg-gray-100 text-gray-800 font-semibold
        hover:bg-gray-200 hover:scale-[1.02]
        transition-all"
          >
            Home
          </button>
        </form>

        {/* ===== FOOTER ===== */}
        <footer className="mt-6 text-xs sm:text-sm text-center text-gray-600">
          <div className="w-16 h-[2px] bg-green-500 mx-auto mb-2 rounded-full"></div>
          Managed & Maintained by{" "}
          <span className="text-green-700 font-semibold">Amit Srivastava</span>{" "}
          | Sr. Manager (IT)
        </footer>
      </div>

      {/* ===== TOAST CONTAINER ===== */}
      <ToastContainer position="top-right" theme="colored" />
    </main>
  );
}