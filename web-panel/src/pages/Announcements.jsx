import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiEdit2,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { announcementsApi } from "../api/apiServices";

const fieldClass =
  "min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

const emptyForm = {
  title: "",
  message: "",
  audience: "all",
  activeFrom: "",
  expiresAt: "",
};

const getAnnouncementList = (response) => {
  const list =
    response?.announcements ??
    response?.data?.announcements ??
    response?.data?.data ??
    response?.data ??
    response;

  if (!Array.isArray(list)) {
    throw new Error("The announcements API returned an invalid response.");
  }

  return list;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const dateTimeInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const dateTimePayloadValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const getAnnouncementStatus = (announcement) => {
  const now = Date.now();
  const activeFrom = announcement.activeFrom
    ? new Date(announcement.activeFrom).getTime()
    : null;
  const expiresAt = announcement.expiresAt
    ? new Date(announcement.expiresAt).getTime()
    : null;

  if (announcement.status === "inactive" || announcement.isActive === false) {
    return "Inactive";
  }
  if (expiresAt !== null && !Number.isNaN(expiresAt) && expiresAt < now) {
    return "Expired";
  }
  if (activeFrom !== null && !Number.isNaN(activeFrom) && activeFrom > now) {
    return "Scheduled";
  }
  return "Active";
};

const getAudienceLabel = (audience) => {
  if (audience === "all") return "Users and influencers";
  if (audience === "users") return "Users";
  if (audience === "influencers") return "Influencers";
  return audience || "—";
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  fallback;

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadAnnouncements = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setPageError("");

    try {
      const response = await announcementsApi.getAll();
      setAnnouncements(getAnnouncementList(response));
    } catch (error) {
      console.error("Unable to load announcements.", error);
      setPageError(getErrorMessage(error, "Unable to load announcements."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    announcementsApi
      .getAll()
      .then((response) => {
        const list = getAnnouncementList(response);
        if (isMounted) {
          setAnnouncements(list);
        }
      })
      .catch((error) => {
        console.error("Unable to load announcements.", error);
        if (isMounted) {
          setPageError(
            getErrorMessage(error, "Unable to load announcements."),
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return announcements;
    return announcements.filter((announcement) =>
      [
        announcement.title,
        announcement.message,
        announcement.audience,
        getAudienceLabel(announcement.audience),
        getAnnouncementStatus(announcement),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [announcements, search]);

  const openCreateModal = () => {
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 7);
    setForm({
      ...emptyForm,
      activeFrom: dateTimeInputValue(now),
      expiresAt: dateTimeInputValue(expiry),
    });
    setFormError("");
    setModal({ mode: "create" });
  };

  const openEditModal = (announcement) => {
    setForm({
      title: announcement.title ?? "",
      message: announcement.message ?? "",
      audience: announcement.audience ?? "all",
      activeFrom: dateTimeInputValue(announcement.activeFrom),
      expiresAt: dateTimeInputValue(announcement.expiresAt),
    });
    setFormError("");
    setModal({ mode: "edit", announcement });
  };

  const submitAnnouncement = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      audience: form.audience,
      activeFrom: dateTimePayloadValue(form.activeFrom),
      expiresAt: dateTimePayloadValue(form.expiresAt),
    };

    if (
      !payload.activeFrom ||
      !payload.expiresAt ||
      new Date(payload.expiresAt) <= new Date(payload.activeFrom)
    ) {
      setFormError("Expiry must be later than the activation date.");
      setSubmitting(false);
      return;
    }

    try {
      if (modal.mode === "edit") {
        await announcementsApi.update(modal.announcement.id, payload);
        setSuccessMessage("Announcement updated.");
      } else {
        await announcementsApi.create(payload);
        setSuccessMessage("Announcement created.");
      }
      setModal(null);
      await loadAnnouncements(true);
    } catch (error) {
      console.error("Unable to save announcement.", error);
      setFormError(getErrorMessage(error, "Unable to save announcement."));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAnnouncement = async (announcement) => {
    const id = announcement.id ?? announcement._id;
    if (!id) {
      setPageError("This announcement cannot be deleted because it has no ID.");
      setModal(null);
      return;
    }

    setDeletingId(String(id));
    setPageError("");
    setSuccessMessage("");

    try {
      await announcementsApi.delete(id);
      const response = await announcementsApi.getAll();
      const latestAnnouncements = getAnnouncementList(response);
      const stillExists = latestAnnouncements.some(
        (item) => String(item.id ?? item._id) === String(id),
      );
      setAnnouncements(latestAnnouncements);

      if (stillExists) {
        setPageError(
          "The server accepted the delete request, but the announcement is still present. Check the backend DELETE handler.",
        );
        setModal(null);
        return;
      }

      setModal(null);
      setSuccessMessage("Announcement deleted.");
    } catch (error) {
      console.error("Unable to delete announcement.", error);
      setPageError(getErrorMessage(error, "Unable to delete announcement."));
      setModal(null);
    } finally {
      setDeletingId("");
    }
  };

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError("");
  };

  return (
    <div className="mx-auto w-full max-w-[1530px] px-3 pb-6 pt-4 sm:px-5 sm:pt-6 lg:px-[38px]">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <a
              aria-label="Back to overview"
              className="grid size-9 place-items-center rounded-lg bg-violet-100 text-violet-700 transition hover:bg-violet-200"
              href="/admin"
            >
              <FiArrowLeft aria-hidden="true" size={18} />
            </a>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
              Announcements
            </h1>
          </div>
          <p className="ml-11 mt-1 text-sm text-slate-500">
            Send updates to users and influencers.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={refreshing || loading}
          onClick={() => loadAnnouncements(true)}
          type="button"
        >
          <FiRefreshCw
            aria-hidden="true"
            className={refreshing ? "animate-spin" : ""}
            size={15}
          />
          Refresh data
        </button>
      </header>

      {successMessage && (
        <p
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {successMessage}
        </p>
      )}
      {pageError && (
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          <span>{pageError}</span>
          <button
            className="font-semibold underline"
            onClick={() => loadAnnouncements()}
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <label className="relative block w-full sm:max-w-[420px]">
          <FiSearch
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
            size={17}
          />
          <input
            aria-label="Search announcements"
            className="min-h-[50px] w-full rounded-lg border border-slate-300 bg-white py-2 pl-11 pr-10 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search announcements..."
            type="search"
            value={search}
          />
          {search && (
            <button
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
              onClick={() => setSearch("")}
              type="button"
            >
              <FiX size={16} />
            </button>
          )}
        </label>
        <button
          className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 text-sm font-medium text-white shadow-sm transition hover:brightness-105"
          onClick={openCreateModal}
          type="button"
        >
          <FiPlus aria-hidden="true" size={17} />
          Add announcement
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-sm font-semibold text-slate-700">
                <th className="px-5 py-4" scope="col">
                  S.No.
                </th>
                <th className="px-4 py-4" scope="col">
                  Title
                </th>
                <th className="px-4 py-4" scope="col">
                  Audience
                </th>
                <th className="px-4 py-4" scope="col">
                  Created
                </th>
                <th className="px-4 py-4" scope="col">
                  Activation
                </th>
                <th className="px-4 py-4" scope="col">
                  Expiry
                </th>
                <th className="px-4 py-4" scope="col">
                  Status
                </th>
                <th className="px-5 py-4" scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    className="px-5 py-10 text-center text-sm text-slate-500"
                    colSpan={8}
                  >
                    Loading announcements…
                  </td>
                </tr>
              ) : filteredAnnouncements.length ? (
                filteredAnnouncements.map((announcement, index) => {
                  const status = getAnnouncementStatus(announcement);
                  return (
                    <tr
                      className="border-b border-slate-100 text-sm text-slate-700 last:border-0 hover:bg-slate-50/70"
                      key={announcement.id ?? announcement._id ?? index}
                    >
                      <td className="px-5 py-5">{index + 1}</td>
                      <td className="max-w-[290px] px-4 py-5">
                        <p className="truncate font-medium text-slate-800">
                          {announcement.title || "Untitled announcement"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {announcement.message || "No message"}
                        </p>
                      </td>
                      <td className="px-4 py-5">
                        {getAudienceLabel(announcement.audience)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-5">
                        {formatDate(announcement.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-5">
                        {formatDate(announcement.activeFrom)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-5">
                        {formatDate(announcement.expiresAt)}
                      </td>
                      <td className="px-4 py-5">
                        <span
                          className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium ${
                            status === "Active"
                              ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                              : status === "Scheduled"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            aria-label={`View ${announcement.title || "announcement"}`}
                            className="grid size-10 place-items-center rounded-xl border border-slate-300 text-violet-700 transition hover:bg-violet-50"
                            onClick={() =>
                              setModal({ mode: "view", announcement })
                            }
                            type="button"
                          >
                            <FiEye aria-hidden="true" size={17} />
                          </button>
                          <button
                            aria-label={`Edit ${announcement.title || "announcement"}`}
                            className="grid size-10 place-items-center rounded-xl border border-slate-300 text-violet-700 transition hover:bg-violet-50"
                            onClick={() => openEditModal(announcement)}
                            type="button"
                          >
                            <FiEdit2 aria-hidden="true" size={17} />
                          </button>
                          <button
                            aria-label={`Delete ${announcement.title || "announcement"}`}
                            className="grid size-10 place-items-center rounded-xl border border-slate-300 text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={
                              deletingId ===
                              String(announcement.id ?? announcement._id ?? "")
                            }
                            onClick={() =>
                              setModal({
                                mode: "delete",
                                announcement,
                              })
                            }
                            title="Delete announcement"
                            type="button"
                          >
                            {deletingId ===
                            String(announcement.id ?? announcement._id ?? "") ? (
                              <FiRefreshCw
                                aria-hidden="true"
                                className="animate-spin"
                                size={17}
                              />
                            ) : (
                              <FiTrash2 aria-hidden="true" size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="px-5 py-12 text-center text-sm text-slate-500"
                    colSpan={8}
                  >
                    {search
                      ? "No announcements match your search."
                      : "No announcements yet. Add one to share an update."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal?.mode === "delete" && (
        <div
          className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingId) {
              setModal(null);
            }
          }}
        >
          <section
            aria-labelledby="announcement-delete-title"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
            role="alertdialog"
          >
            <h2
              className="text-lg font-bold text-slate-800"
              id="announcement-delete-title"
            >
              Delete announcement?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This will permanently delete “
              {modal.announcement.title || "Untitled announcement"}”.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                disabled={Boolean(deletingId)}
                onClick={() => setModal(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={Boolean(deletingId)}
                onClick={() => deleteAnnouncement(modal.announcement)}
                type="button"
              >
                {deletingId && (
                  <FiRefreshCw
                    aria-hidden="true"
                    className="animate-spin"
                    size={15}
                  />
                )}
                {deletingId ? "Deleting…" : "Delete announcement"}
              </button>
            </div>
          </section>
        </div>
      )}

      {modal?.mode === "view" && (
        <div
          className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <section
            aria-labelledby="announcement-view-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  Announcement details
                </p>
                <h2
                  className="mt-1 text-lg font-bold text-slate-800"
                  id="announcement-view-title"
                >
                  {modal.announcement.title || "Untitled announcement"}
                </h2>
              </div>
              <button
                aria-label="Close details"
                className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                onClick={() => setModal(null)}
                type="button"
              >
                <FiX size={18} />
              </button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {modal.announcement.message}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs">
              <div>
                <dt className="text-slate-500">Audience</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {getAudienceLabel(modal.announcement.audience)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {getAnnouncementStatus(modal.announcement)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Activation</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {formatDate(modal.announcement.activeFrom)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Expiry</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {formatDate(modal.announcement.expiresAt)}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      {(modal?.mode === "create" || modal?.mode === "edit") && (
        <div
          className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setModal(null);
            }
          }}
        >
          <form
            aria-labelledby="announcement-form-title"
            aria-modal="true"
            className="my-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
            onSubmit={submitAnnouncement}
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  Platform updates
                </p>
                <h2
                  className="mt-1 text-lg font-bold text-slate-800"
                  id="announcement-form-title"
                >
                  {modal.mode === "edit"
                    ? "Edit announcement"
                    : "Add announcement"}
                </h2>
              </div>
              <button
                aria-label="Close form"
                className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                disabled={submitting}
                onClick={() => setModal(null)}
                type="button"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                Title
                <input
                  className={fieldClass}
                  maxLength={120}
                  name="title"
                  onChange={updateForm}
                  placeholder="e.g. Welcome to MeetFame"
                  required
                  value={form.title}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                Message
                <textarea
                  className={`${fieldClass} min-h-28 resize-y py-2.5`}
                  maxLength={2000}
                  name="message"
                  onChange={updateForm}
                  placeholder="Write your announcement…"
                  required
                  value={form.message}
                />
                <span className="text-right text-[10px] font-normal text-slate-400">
                  {form.message.length}/2000
                </span>
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                Audience
                <select
                  className={fieldClass}
                  name="audience"
                  onChange={updateForm}
                  value={form.audience}
                >
                  <option value="all">Users and influencers</option>
                  <option value="users">Users</option>
                  <option value="influencers">Influencers</option>
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <FiCalendar aria-hidden="true" size={14} />
                    Activation
                  </span>
                  <input
                    className={fieldClass}
                    name="activeFrom"
                    onChange={updateForm}
                    required
                    type="datetime-local"
                    value={form.activeFrom}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <FiCalendar aria-hidden="true" size={14} />
                    Expiry
                  </span>
                  <input
                    className={fieldClass}
                    name="expiresAt"
                    onChange={updateForm}
                    required
                    type="datetime-local"
                    value={form.expiresAt}
                  />
                </label>
              </div>
            </div>

            {formError && (
              <p className="mt-4 text-xs text-rose-600" role="alert">
                {formError}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                disabled={submitting}
                onClick={() => setModal(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting && (
                  <FiRefreshCw
                    aria-hidden="true"
                    className="animate-spin"
                    size={15}
                  />
                )}
                {submitting
                  ? "Saving…"
                  : modal.mode === "edit"
                    ? "Save changes"
                    : "Create announcement"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Announcements;
