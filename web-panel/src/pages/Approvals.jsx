import { useEffect, useMemo, useState } from "react";
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiSearch,
  FiShield,
  FiSlash,
  FiX,
} from "react-icons/fi";
import { influencersApi } from "../api/apiServices";

const panelClass =
  "min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5";

const getInfluencerList = (response) => {
  const list =
    response?.influencers ??
    response?.data?.influencers ??
    response?.data?.data ??
    response?.data ??
    response;

  if (!Array.isArray(list)) {
    throw new Error("The influencers API returned an invalid response.");
  }

  return list;
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  fallback;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const formatStatus = (status) =>
  String(status || "unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getStatusStyle = (status) => {
  if (status === "approved") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";
  }
  if (status === "pending_review") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700";
  }
  if (status === "blocked" || status === "rejected") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-600";
  }
  return "border-slate-300 bg-slate-100 text-slate-600";
};

const Approvals = () => {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionId, setActionId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    influencersApi
      .getAll()
      .then((response) => {
        const list = getInfluencerList(response);
        if (isMounted) {
          setInfluencers(list);
        }
      })
      .catch((error) => {
        console.error("Unable to load influencer applications.", error);
        if (isMounted) {
          setPageError(
            getErrorMessage(error, "Unable to load influencer applications."),
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
  }, [reloadKey]);

  const counts = useMemo(
    () => ({
      all: influencers.length,
      pending: influencers.filter(
        (influencer) => influencer.status === "pending_review",
      ).length,
      approved: influencers.filter(
        (influencer) => influencer.status === "approved",
      ).length,
      verified: influencers.filter((influencer) => influencer.isVerified)
        .length,
    }),
    [influencers],
  );

  const filteredInfluencers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return influencers.filter((influencer) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" &&
          influencer.status === "pending_review") ||
        (statusFilter === "blocked" &&
          (influencer.status === "blocked" ||
            influencer.status === "rejected")) ||
        influencer.status === statusFilter;
      const searchableText = [
        influencer.name,
        influencer.email,
        influencer.phone,
        influencer.category,
        influencer.specialization,
        influencer.status,
        influencer.statusReason,
        influencer.certification?.title,
        influencer.certification?.fileName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [influencers, search, statusFilter]);

  const updateInfluencerStatus = async (influencer, status, reason = "") => {
    setActionId(influencer.id);
    setActionError("");

    try {
      await influencersApi.updateStatus(influencer.id, status, reason);
      setLoading(true);
      setPageError("");
      setReloadKey((current) => current + 1);
    } catch (error) {
      console.error("Unable to update influencer application status.", error);
      setActionError(
        getErrorMessage(error, "Unable to update application status."),
      );
    } finally {
      setActionId("");
    }
  };

  const handleDecline = (influencer) => {
    const reason = window.prompt(
      `Reason for declining ${influencer.name}'s application (optional):`,
      influencer.statusReason || "",
    );
    if (reason === null) return;
    updateInfluencerStatus(influencer, "rejected", reason.trim());
  };

  const handleBlock = (influencer) => {
    const reason = window.prompt(
      `Reason for blocking ${influencer.name}:`,
      influencer.statusReason || "",
    );
    if (reason === null) return;
    updateInfluencerStatus(influencer, "blocked", reason.trim());
  };

  const handleCertificateVerification = async (influencer) => {
    setActionId(influencer.id);
    setActionError("");

    try {
      await influencersApi.verifyCertificate(
        influencer.id,
        true,
        "verified",
      );
      setLoading(true);
      setPageError("");
      setReloadKey((current) => current + 1);
    } catch (error) {
      console.error("Unable to verify influencer certificate.", error);
      setActionError(
        getErrorMessage(error, "Unable to verify certificate."),
      );
    } finally {
      setActionId("");
    }
  };

  const filters = [
    { id: "all", label: "All applications", count: counts.all },
    { id: "pending", label: "Pending review", count: counts.pending },
    { id: "approved", label: "Approved", count: counts.approved },
    {
      id: "blocked",
      label: "Blocked",
      count: influencers.filter(
        (item) => item.status === "blocked" || item.status === "rejected",
      ).length,
    },
  ];

  return (
    <div className="mx-auto max-w-[1530px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
      <section className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 text-[9px] font-bold tracking-[1.1px] text-slate-400">
            REVIEW CREATOR APPLICATIONS
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-[#18213e]">
            Approvals
          </h1>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Review influencer profiles and verify their credentials.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <FiClock aria-hidden="true" className="text-amber-500" size={14} />
          {loading ? "Loading applications…" : `${counts.pending} awaiting review`}
        </div>
      </section>

      <section
        aria-label="Application summary"
        className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          ["Total applications", counts.all, "text-violet-600"],
          ["Pending review", counts.pending, "text-amber-600"],
          ["Approved", counts.approved, "text-emerald-600"],
          ["Verified creators", counts.verified, "text-sky-600"],
        ].map(([label, value, color]) => (
          <article className={panelClass} key={label}>
            <span className="text-[10px] font-medium text-slate-500">
              {label}
            </span>
            <strong className={`mt-2 block text-2xl ${color}`}>
              {loading ? "—" : value}
            </strong>
          </article>
        ))}
      </section>

      <section className={panelClass}>
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Influencer applications
            </h2>
            <p className="mt-1 text-[10px] text-slate-400">
              {loading
                ? "Loading applications…"
                : `${filteredInfluencers.length} applications shown`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1.5">
              {filters.map((filter) => (
                <button
                  aria-pressed={statusFilter === filter.id}
                  className={`rounded-lg px-2.5 py-1.5 text-[9px] font-semibold transition ${
                    statusFilter === filter.id
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                  <span className="ml-1 opacity-75">{filter.count}</span>
                </button>
              ))}
            </div>

            <label className="relative block sm:w-64">
              <span className="sr-only">Search applications</span>
              <FiSearch
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, category…"
                type="search"
                value={search}
              />
            </label>
          </div>
        </div>

        {(pageError || actionError) && (
          <div
            className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-700"
            role="alert"
          >
            <span>{pageError || actionError}</span>
            {pageError && (
              <button
                className="shrink-0 font-semibold underline"
                onClick={() => {
                  setPageError("");
                  setLoading(true);
                  setReloadKey((current) => current + 1);
                }}
                type="button"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[1420px] table-fixed border-collapse text-left">
            <caption className="sr-only">Influencer applications</caption>
            <colgroup>
              <col className="w-[52px]" />
              <col className="w-[220px]" />
              <col className="w-[190px]" />
              <col className="w-[145px]" />
              <col className="w-[78px]" />
              <col className="w-[130px]" />
              <col className="w-[205px]" />
              <col className="w-[145px]" />
              <col className="w-[255px]" />
            </colgroup>
            <thead>
              <tr className="border-y border-slate-100 text-[8px] font-bold tracking-wider text-slate-400">
                <th className="px-2 py-3">Sr. No.</th>
                <th className="px-2 py-3">Influencer</th>
                <th className="px-2 py-3">Contact</th>
                <th className="px-2 py-3">Category</th>
                <th className="px-2 py-3">Rate</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Certification</th>
                <th className="px-2 py-3">Blocking remark</th>
                <th className="px-2 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInfluencers.map((influencer, index) => {
                const isPending = influencer.status === "pending_review";
                const certificate = influencer.certification;
                const isBusy = actionId === influencer.id;
                const initials =
                  influencer.name
                    ?.split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0].toUpperCase())
                    .join("") || "?";

                return (
                  <tr
                    className="border-b border-slate-100 align-top last:border-0"
                    key={influencer.id}
                  >
                    <td className="px-2 py-3 text-[9px] text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {influencer.avatar ? (
                          <img
                            alt=""
                            className="size-10 shrink-0 rounded-xl object-cover"
                            loading="lazy"
                            src={influencer.avatar}
                          />
                        ) : (
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
                            {initials}
                          </span>
                        )}
                        <span className="min-w-0">
                          <strong className="flex items-center gap-1 text-[10px] font-semibold text-slate-800">
                            <span className="truncate">{influencer.name}</span>
                            {influencer.isVerified && (
                              <FiCheckCircle
                                aria-label="Verified influencer"
                                className="shrink-0 text-sky-500"
                                size={14}
                              />
                            )}
                          </strong>
                          <span className="mt-0.5 block max-w-[190px] truncate text-[9px] text-slate-400">
                            {influencer.specialization || "Specialization not set"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="break-words px-2 py-3 align-middle text-[9px] text-slate-600">
                      <a
                        className="block max-w-[180px] truncate hover:text-violet-700"
                        href={`mailto:${influencer.email}`}
                      >
                        {influencer.email || "—"}
                      </a>
                      <a
                        className="mt-1 block text-slate-400 hover:text-violet-700"
                        href={`tel:${influencer.phone}`}
                      >
                        {influencer.phone || "—"}
                      </a>
                    </td>
                    <td className="break-words px-2 py-3 align-middle text-[9px] text-slate-600">
                      {influencer.category || "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-[9px] font-semibold text-slate-700">
                      {influencer.hourlyRate === null ||
                      influencer.hourlyRate === undefined
                        ? "—"
                        : `$${influencer.hourlyRate}/hr`}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-wide ${getStatusStyle(influencer.status)}`}
                      >
                        {formatStatus(influencer.status)}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      {certificate?.fileUrl ? (
                        <div className="grid justify-items-start gap-1">
                          <a
                            className="inline-flex max-w-full min-w-0 items-center gap-1 text-[9px] font-medium text-violet-700 hover:text-violet-900"
                            href={certificate.fileUrl}
                            rel="noreferrer"
                            target="_blank"
                            title={certificate.fileName || certificate.title}
                          >
                            <FiFileText
                              aria-hidden="true"
                              className="shrink-0"
                              size={13}
                            />
                            <span className="truncate">
                              {certificate.title || certificate.fileName}
                            </span>
                          </a>
                          <span
                            className={`text-[8px] ${
                              influencer.certificateStatus === "verified"
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {formatStatus(influencer.certificateStatus)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="break-words px-2 py-3 align-middle text-[9px] text-slate-500">
                      {influencer.statusReason || "—"}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <button
                          aria-label={`View details for ${influencer.name}`}
                          className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-violet-700"
                          onClick={() => setSelectedInfluencer(influencer)}
                          title="View details"
                          type="button"
                        >
                          <FiEye aria-hidden="true" size={15} />
                        </button>
                        {isPending && (
                          <>
                            <button
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-2 text-[9px] font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                              disabled={isBusy || Boolean(actionId)}
                              onClick={() =>
                                updateInfluencerStatus(influencer, "approved")
                              }
                              type="button"
                            >
                              <FiCheck aria-hidden="true" size={13} />
                              Approve
                            </button>
                            <button
                              className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-2 text-[9px] font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                              disabled={isBusy || Boolean(actionId)}
                              onClick={() => handleDecline(influencer)}
                              type="button"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {certificate?.fileUrl &&
                          influencer.certificateStatus !== "verified" && (
                            <button
                              className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-2 text-[9px] font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
                              disabled={isBusy || Boolean(actionId)}
                              onClick={() =>
                                handleCertificateVerification(influencer)
                              }
                              type="button"
                            >
                              <FiShield aria-hidden="true" size={13} />
                              Verify certificate
                            </button>
                          )}
                        {influencer.status !== "blocked" &&
                          influencer.status !== "rejected" && (
                            <button
                              aria-label={`Block ${influencer.name}`}
                              className="grid size-8 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                              disabled={isBusy || Boolean(actionId)}
                              onClick={() => handleBlock(influencer)}
                              title="Block influencer"
                              type="button"
                            >
                              <FiSlash aria-hidden="true" size={14} />
                            </button>
                          )}
                        {isBusy && (
                          <span className="text-[8px] text-slate-400">
                            Saving…
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && !pageError && filteredInfluencers.length === 0 && (
                <tr>
                  <td
                    className="p-8 text-center text-[10px] text-slate-400"
                    colSpan="9"
                  >
                    No applications match these filters.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    className="p-8 text-center text-[10px] text-slate-400"
                    colSpan="9"
                  >
                    Loading applications…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedInfluencer && (
        <div
          className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedInfluencer(null)}
        >
          <section
            aria-labelledby="approval-details-title"
            aria-modal="true"
            className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold tracking-[1.1px] text-violet-600">
                  APPLICATION DETAILS
                </p>
                <h2
                  className="mt-1 text-lg font-bold text-slate-800"
                  id="approval-details-title"
                >
                  {selectedInfluencer.name}
                </h2>
              </div>
              <button
                aria-label="Close application details"
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setSelectedInfluencer(null)}
                type="button"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
            <dl className="grid gap-4 text-[10px] sm:grid-cols-2">
              {[
                ["Email", selectedInfluencer.email],
                ["Phone", selectedInfluencer.phone],
                ["Category", selectedInfluencer.category],
                ["Specialization", selectedInfluencer.specialization],
                [
                  "Hourly rate",
                  selectedInfluencer.hourlyRate == null
                    ? "—"
                    : `$${selectedInfluencer.hourlyRate}/hr`,
                ],
                ["Applied", formatDate(selectedInfluencer.createdAt)],
                ["Status", formatStatus(selectedInfluencer.status)],
                [
                  "Certificate",
                  selectedInfluencer.certification?.title || "Not provided",
                ],
              ].map(([label, value]) => (
                <div className="min-w-0" key={label}>
                  <dt className="font-semibold text-slate-400">{label}</dt>
                  <dd className="mt-1 break-words text-slate-700">
                    {value || "—"}
                  </dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-400">Biography</dt>
                <dd className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-600">
                  {selectedInfluencer.bio || "No biography provided."}
                </dd>
              </div>
              {selectedInfluencer.statusReason && (
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-slate-400">
                    Blocking remark
                  </dt>
                  <dd className="mt-1 text-rose-600">
                    {selectedInfluencer.statusReason}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      )}
    </div>
  );
};

export default Approvals;
