import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowRight, FiLock, FiMail, FiShield } from "react-icons/fi";
import { authApi } from "../api/apiServices";
import { getAuthToken } from "../api/axiosInstance";

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@meetfame.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      await authApi.login(email, password);
      if (!getAuthToken()) {
        setMessage(
          "Login succeeded, but the server did not return an authentication token.",
        );
        return;
      };

      navigate(location.state?.from?.pathname || "/admin", { replace: true });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    };
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-violet-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 size-72 rounded-full bg-fuchsia-600/10 blur-3xl"
      />

      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-48 rounded-full bg-violet-500/20 blur-3xl"
        />

        <header className="relative mb-8 text-center">
          <div className="mb-3 inline-flex flex-col items-center">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
              MeetFame
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
              Admin Command Center
            </span>
          </div>

          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
            <FiShield aria-hidden="true" className="size-3.5" />
            <span>Master Administration Access</span>
          </div>

          <p className="text-xs leading-relaxed text-slate-400">
            Sign in to manage influencer approvals, slots, bookings &amp;
            conversations.
          </p>
        </header>

        <form className="relative space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-1 block text-xs font-semibold text-slate-300"
              htmlFor="admin-email"
            >
              Admin Email
            </label>
            <div className="relative">
              <FiMail
                aria-hidden="true"
                className="absolute left-3.5 top-3 size-4 text-slate-500"
              />
              <input
                autoComplete="username"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                id="admin-email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@meetfame.com"
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-semibold text-slate-300"
              htmlFor="admin-password"
            >
              Admin Password
            </label>
            <div className="relative">
              <FiLock
                aria-hidden="true"
                className="absolute left-3.5 top-3 size-4 text-slate-500"
              />
              <input
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                id="admin-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                type="password"
                value={password}
              />
            </div>
          </div>

          <button
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-orange-400 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in…" : "Sign In to Command Center"}
            <FiArrowRight aria-hidden="true" className="size-4" />
          </button>

          {message && (
            <p className="text-center text-xs text-rose-300" role="alert">
              {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
