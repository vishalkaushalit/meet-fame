import { useMemo, useState } from "react";
import { FiStar } from "react-icons/fi";

const reviews = [
  {
    name: "Maya Chen",
    service: "Brand strategy call",
    date: "Oct 15, 2026",
    rating: 5,
    text: "Such a valuable conversation! I left with a clear plan and lots of ideas.",
    initials: "MC",
    color: "bg-purple-100 text-purple-700",
  },
  {
    name: "Amara Okafor",
    service: "Creative direction",
    date: "Oct 13, 2026",
    rating: 5,
    text: "Thoughtful feedback and an inspiring session. Highly recommend!",
    initials: "AO",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Jordan Lee",
    service: "1:1 coaching session",
    date: "Oct 11, 2026",
    rating: 4,
    text: "Great advice and actionable next steps. Thank you for your time.",
    initials: "JL",
    color: "bg-orange-100 text-orange-700",
  },
  {
    name: "Noah Williams",
    service: "Portfolio review",
    date: "Oct 09, 2026",
    rating: 5,
    text: "The review helped me see my portfolio in a whole new way.",
    initials: "NW",
    color: "bg-emerald-100 text-emerald-700",
  },
];

const panelClass =
  "min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5";

function Reviews() {
  const [ratingFilter, setRatingFilter] = useState("All ratings");
  const filteredReviews = useMemo(
    () =>
      reviews.filter(
        (review) =>
          ratingFilter === "All ratings" ||
          review.rating === Number(ratingFilter),
      ),
    [ratingFilter],
  );

  return (
    <div className="mx-auto max-w-[1530px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
      <section className="mb-5">
        <div className="mb-2 text-[9px] font-bold tracking-[1.1px] text-slate-400">
          CLIENT FEEDBACK
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-[#18213e]">
          Reviews
        </h1>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Read what clients are saying about your sessions.
        </p>
      </section>

      <section aria-label="Review summary" className="mb-4 grid gap-3 sm:grid-cols-3">
        <article className={`${panelClass} sm:col-span-1`}>
          <span className="text-[10px] font-medium text-slate-500">
            Average rating
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <strong className="text-3xl text-slate-800">4.9</strong>
            <span className="text-[10px] text-slate-400">out of 5</span>
          </div>
          <div aria-label="5 out of 5 stars" className="mt-2 flex gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar aria-hidden="true" fill="currentColor" key={star} size={14} />
            ))}
          </div>
        </article>
        <article className={`${panelClass} sm:col-span-2`}>
          <span className="text-[10px] font-medium text-slate-500">
            Rating breakdown
          </span>
          <div className="mt-3 grid gap-2">
            {[5, 4, 3].map((rating) => {
              const count = reviews.filter(
                (review) => review.rating === rating,
              ).length;
              return (
                <div
                  className="grid grid-cols-[32px_1fr_24px] items-center gap-2 text-[9px] text-slate-500"
                  key={rating}
                >
                  <span>{rating} stars</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-amber-400"
                      style={{ width: `${(count / reviews.length) * 100}%` }}
                    />
                  </span>
                  <span className="text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Recent reviews
          </h2>
          <label className="sr-only" htmlFor="review-rating">
            Filter reviews by rating
          </label>
          <select
            className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] text-slate-600 outline-none focus:border-violet-400"
            id="review-rating"
            onChange={(event) => setRatingFilter(event.target.value)}
            value={ratingFilter}
          >
            <option>All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
          </select>
        </div>
        {filteredReviews.length ? (
          filteredReviews.map((review) => (
            <article className={panelClass} key={`${review.name}-${review.date}`}>
              <div className="flex items-start gap-3">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-[9px] font-bold ${review.color}`}
                >
                  {review.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-[11px] font-semibold text-slate-700">
                        {review.name}
                      </h3>
                      <p className="mt-0.5 text-[9px] text-slate-400">
                        {review.service} · {review.date}
                      </p>
                    </div>
                    <span
                      aria-label={`${review.rating} out of 5 stars`}
                      className="flex gap-0.5 text-amber-400"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar
                          aria-hidden="true"
                          fill={star <= review.rating ? "currentColor" : "none"}
                          key={star}
                          size={12}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
                    {review.text}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className={`${panelClass} text-center text-[10px] text-slate-400`}>
            No reviews match this rating.
          </p>
        )}
      </section>
    </div>
  );
}

export default Reviews;
