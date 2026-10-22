import { useState } from "react";
import { FiCheck, FiSave } from "react-icons/fi";

const fieldClass =
  "min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

const defaultSettings = {
  name: "Samira Khan",
  email: "samira@example.com",
  handle: "@samirakhan",
  timezone: "America/Los_Angeles",
  bookingEmails: true,
  productEmails: false,
};

const readSettings = () => {
  try {
    const saved = window.localStorage.getItem("meetfame-settings");
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch (error) {
    console.error("Unable to load saved settings.", error);
    return defaultSettings;
  }
};

const Settings = () => {
  const [settings, setSettings] = useState(readSettings);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const updateSetting = (event) => {
    const { checked, name, type, value } = event.target;
    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setSaved(false);
    setSaveError("");
  };

  const saveSettings = (event) => {
    event.preventDefault();
    try {
      window.localStorage.setItem("meetfame-settings", JSON.stringify(settings));
      setSaved(true);
      setSaveError("");
    } catch (error) {
      console.error("Unable to save settings.", error);
      setSaved(false);
      setSaveError("Settings could not be saved in this browser.");
    };
  };

  return (
    <div className="mx-auto max-w-[1000px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
      <section className="mb-5">
        <div className="mb-2 text-[9px] font-bold tracking-[1.1px] text-slate-400">
          PERSONALIZE YOUR WORKSPACE
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-[#18213e]">
          Settings
        </h1>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Manage your profile and notification preferences.
        </p>
      </section>

      <form className="grid gap-4" onSubmit={saveSettings}>
        <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-slate-800">
            Profile information
          </h2>
          <p className="mt-1 text-[9px] text-slate-400">
            These details are saved in this browser.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
              Display name
              <input
                className={fieldClass}
                name="name"
                onChange={updateSetting}
                required
                value={settings.name}
              />
            </label>
            <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
              Email address
              <input
                className={fieldClass}
                name="email"
                onChange={updateSetting}
                required
                type="email"
                value={settings.email}
              />
            </label>
            <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
              Profile handle
              <input
                className={fieldClass}
                name="handle"
                onChange={updateSetting}
                required
                value={settings.handle}
              />
            </label>
            <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
              Time zone
              <select
                className={fieldClass}
                name="timezone"
                onChange={updateSetting}
                value={settings.timezone}
              >
                <option value="America/Los_Angeles">
                  Pacific Time (US & Canada)
                </option>
                <option value="America/Denver">Mountain Time (US & Canada)</option>
                <option value="America/Chicago">Central Time (US & Canada)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Kolkata">India Standard Time</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-slate-800">
            Email notifications
          </h2>
          <div className="mt-4 grid gap-4">
            <label className="flex items-start gap-3 text-[10px] text-slate-600">
              <input
                checked={settings.bookingEmails}
                className="mt-0.5 accent-violet-600"
                name="bookingEmails"
                onChange={updateSetting}
                type="checkbox"
              />
              <span>
                <strong className="block font-semibold text-slate-700">
                  Booking updates
                </strong>
                Receive confirmations, cancellations, and schedule changes.
              </span>
            </label>
            <label className="flex items-start gap-3 text-[10px] text-slate-600">
              <input
                checked={settings.productEmails}
                className="mt-0.5 accent-violet-600"
                name="productEmails"
                onChange={updateSetting}
                type="checkbox"
              />
              <span>
                <strong className="block font-semibold text-slate-700">
                  Product news
                </strong>
                Get occasional MeetFame feature and product updates.
              </span>
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          {saveError && (
            <span className="text-[10px] font-medium text-rose-600" role="alert">
              {saveError}
            </span>
          )}
          {saved && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
              <FiCheck aria-hidden="true" size={14} />
              Saved in this browser
            </span>
          )}
          <button
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-3.5 text-[11px] font-semibold text-white shadow-md shadow-violet-600/20 transition hover:-translate-y-px"
            type="submit"
          >
            <FiSave aria-hidden="true" size={15} />
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
