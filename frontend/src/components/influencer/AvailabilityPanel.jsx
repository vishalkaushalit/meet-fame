import React from 'react';
import { Clock, Save, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { dayRanges } from '../../../../shared/availability';

export default function AvailabilityPanel({
  days,
  availability,
  generatedSlots,
  activeDay,
  setActiveDay,
  savingSlots,
  saveSuccess,
  handleSaveAvailability,
  handleAddRange,
  handleRemoveRange,
  handleRangeChange,
}) {
  return (
    <div className="space-y-6">
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-purple" />
              <span>Day-Wise Availability & 1-Hour Slot Generator</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Example: Enter Monday from 9am to 12pm & 5pm to 8pm — MeetFame
              will autogenerate 1-hour bookable slots (9-10, 10-11, 11-12, 5-6,
              6-7, 7-8).
            </p>
          </div>

          <button
            onClick={handleSaveAvailability}
            disabled={savingSlots}
            className="py-2.5 px-6 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-brand-indigo to-brand-purple hover:opacity-95 shadow-md flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{savingSlots ? <span>Saving...</span> : 'Save changes'}</span>
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Day Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {days.map((d) => {
            const count = dayRanges(availability[d]).length || 0;
            const slotCount = generatedSlots[d]?.length || 0;
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  return setActiveDay(d);
                }}
                className={`px-4 py-3 rounded-2xl font-semibold capitalize text-xs transition-all whitespace-nowrap border text-left min-w-[120px] ${
                  activeDay === d
                    ? 'bg-slate-800 border-brand-purple text-white shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{d}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${count > 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}
                  >
                    {count} windows
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-normal mt-1">
                  {slotCount} slots generated
                </div>
              </button>
            );
          })}
        </div>

        {/* Time Window Editor for Active Day */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Time Ranges for</span>
              <span className="text-brand-purple capitalize">{activeDay}</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                return handleAddRange(activeDay);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5 text-brand-coral" />
              <span>Add Time Window</span>
            </button>
          </div>

          {dayRanges(availability[activeDay]).length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              You are marked unavailable on {activeDay}s. Click "Add Time
              Window" to open booking slots.
            </div>
          ) : (
            <div className="space-y-3">
              {dayRanges(availability[activeDay]).map((range, idx) => {
                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400">
                        Available from:
                      </span>
                      <input
                        type="time"
                        value={range.start}
                        onChange={(e) => {
                          return handleRangeChange(
                            activeDay,
                            idx,
                            'start',
                            e.target.value,
                          );
                        }}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">until:</span>
                      <input
                        type="time"
                        value={range.end}
                        onChange={(e) => {
                          return handleRangeChange(
                            activeDay,
                            idx,
                            'end',
                            e.target.value,
                          );
                        }}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        return handleRemoveRange(activeDay, idx);
                      }}
                      className="ml-auto text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Generated 1-Hour Slots Showcase */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Live Preview: Auto-Generated 1-Hour Slots for {activeDay}
            </span>
            <span className="text-xs text-indigo-400 font-semibold">
              {generatedSlots[activeDay]?.length || 0} Total 1-Hour Slots
            </span>
          </div>

          {generatedSlots[activeDay]?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {generatedSlots[activeDay]?.map((s) => {
                return (
                  <div
                    key={s.slotId}
                    className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono font-medium flex items-center gap-2 shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5 text-brand-purple" />
                    <span>
                      {s.label} ({s.slotId})
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No slots currently generated. Add time windows above and save to
              create slots.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
