import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { paginate, paginationNumbers } from '../../../shared/pagination';
export function usePagination(items, resetKey = '', pageSize = 10) {
  const [state, setState] = useState({ key: resetKey, page: 1 });
  const result = paginate(
    items,
    state.key === resetKey ? state.page : 1,
    pageSize,
  );
  return {
    ...result,
    setPage: (page) => {
      return setState({ key: resetKey, page });
    },
  };
}
export default function Pagination({ pagination, label = 'records' }) {
  const { page, pages, setPage } = pagination;
  if (pages <= 1) {
    return null;
  }
  return (
    <nav className="record-pagination" aria-label={`${label} pagination`}>
      <div>
        <button
          type="button"
          disabled={page === 1}
          onClick={() => {
            return setPage(page - 1);
          }}
          aria-label={`Previous page of ${label}`}
        >
          <ChevronLeft size={15} />
          Prev
        </button>
        {paginationNumbers(page, pages).map((number) => {
          return typeof number === 'number' ? (
            <button
              key={number}
              type="button"
              aria-label={`Page ${number} of ${label}`}
              aria-current={page === number ? 'page' : undefined}
              onClick={() => {
                return setPage(number);
              }}
            >
              {number}
            </button>
          ) : (
            <span key={number} aria-hidden="true">
              …
            </span>
          );
        })}
        <button
          type="button"
          disabled={page === pages}
          onClick={() => {
            return setPage(page + 1);
          }}
          aria-label={`Next page of ${label}`}
        >
          Next
          <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  );
}
