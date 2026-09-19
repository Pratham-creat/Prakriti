import { useState } from "react";
import { api, setToken } from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await api.login({
  username,
  password,
});

      console.log("LOGIN RESPONSE:", data);

      if (!data.access_token) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      setToken(data.access_token);

      onLogin(username);
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

        <div className="mb-8">
          <div className="text-2xl font-bold text-emerald-700">
            Prakriti
          </div>

          <h1 className="mt-2 text-xl font-semibold text-slate-900">
            Sign in
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Nursery Management System
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Username
            </span>

            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </span>

            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

        </form>

        <p className="mt-6 text-xs text-slate-400">
          Demo: admin / admin123
        </p>

      </div>
    </main>
  );
}