"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const [number, setNumber] = useState("");
  const router = useRouter();

  const handleNavigate = async () => {
    try {
      // const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:8000/api/v1` : 'http://localhost:8000/api/v1';
      const apiBase = typeof window !== 'undefined' ? `http://localhost:8000/api/v1` : 'https://caloxi.xoraxi.cloud/api/v3';
      const res = await fetch(`${apiBase}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: number })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("adminToken", data.token);
        router.push("/admin/notifications");
      } else {
        alert(data.message || "Access denied");
      }
    } catch (err) {
      console.error("Login error", err);
      alert("Failed to connect to admin server");
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Admin Dashboard Access
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Enter the access code to navigate to the Notification Manager.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <input
              type="text"
              placeholder="Enter access code"
              className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 text-black dark:text-white"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
            <button
              onClick={handleNavigate}
              className="w-full h-12 flex items-center justify-center rounded-xl bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition-all"
            >
              Access Manager
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-800 w-full">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
