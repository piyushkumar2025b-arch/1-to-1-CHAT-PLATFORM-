import React, { useState, useEffect, FormEvent } from 'react';
import {
  Users,
  CheckCircle2,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { collection, doc, setDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeForFirestore } from '../lib/sanitize';
import { GroupRoomRequest } from '../types';

interface GroupRoomRequestFormProps {
  mode?: 'light' | 'dark';
}

export function GroupRoomRequestForm({ mode = 'light' }: GroupRoomRequestFormProps) {
  const isLight = mode === 'light';
  const [requestedSize, setRequestedSize] = useState<number>(4);
  const [useCase, setUseCase] = useState<string>('Confidential Work Team');
  const [customDetails, setCustomDetails] = useState<string>('');
  const [contact, setContact] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedRequest, setSubmittedRequest] = useState<GroupRoomRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load previously saved request from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('saved_group_room_request');
      if (saved) {
        setSubmittedRequest(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const sizeOptions = [
    { label: '3 – 4 people', value: 4 },
    { label: '5 – 8 people', value: 8 },
    { label: '9 – 15 people', value: 15 },
    { label: '20+ people', value: 25 },
  ];

  const useCases = [
    'Confidential Work Team',
    'Private Family & Friends',
    'Secure Study Group',
    'Investigative Research & Press',
    'Gaming Squad',
    'Other / Community',
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (requestedSize < 3) {
      setErrorMessage('Please select a group size of 3 or more people.');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestId = 'req_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
      const newRequest: GroupRoomRequest = {
        id: requestId,
        requestedSize,
        useCase,
        customDetails: customDetails.trim()
          ? sanitizeForFirestore(customDetails.trim())
          : undefined,
        securityPriority: 'High Confidentiality',
        contact: contact.trim()
          ? sanitizeForFirestore(contact.trim())
          : undefined,
        createdAt: new Date().toISOString(),
      };

      // Persist in Firestore
      const reqRef = doc(collection(db, 'group_requests'), requestId);
      await setDoc(reqRef, newRequest);

      // Keep in localStorage for the user
      localStorage.setItem('saved_group_room_request', JSON.stringify(newRequest));
      setSubmittedRequest(newRequest);
    } catch (err: unknown) {
      console.error('Error submitting group room request:', err);
      // Fallback: save locally
      const fallbackRequest: GroupRoomRequest = {
        id: 'local_' + Date.now(),
        requestedSize,
        useCase,
        customDetails: customDetails.trim() || undefined,
        securityPriority: 'High Confidentiality',
        contact: contact.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('saved_group_room_request', JSON.stringify(fallbackRequest));
      setSubmittedRequest(fallbackRequest);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedRequest(null);
    try {
      localStorage.removeItem('saved_group_room_request');
    } catch {
      // ignore
    }
  };

  return (
    <section
      id="group-room-form-section"
      className={`w-full py-16 lg:py-20 px-4 sm:px-6 lg:px-8 border-t relative z-10 transition-colors ${
        isLight
          ? 'border-slate-200 bg-slate-50/70'
          : 'border-neutral-850 bg-neutral-950/85 backdrop-blur-[2px]'
      }`}
    >
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="space-y-3 text-left">
          <div
            className={`flex items-center gap-2 text-xs font-semibold ${
              isLight ? 'text-emerald-700' : 'text-emerald-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Multi-User Capacity</span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            Rooms for more than 2 people will be made if asked.
          </h2>
          <p
            className={`text-sm sm:text-base leading-relaxed max-w-2xl ${
              isLight ? 'text-slate-700' : 'text-neutral-300'
            }`}
          >
            Currently, every room is strictly capped at two participants to keep communication strictly private.
            If your team, family, or study group needs multi-person rooms, tell us below. We build features based directly on user requests.
          </p>
        </div>

        {/* Persistent Submitted Receipt View */}
        {submittedRequest ? (
          <div
            className={`border rounded-2xl p-6 sm:p-8 space-y-6 text-left shadow-xs transition-colors ${
              isLight
                ? 'border-slate-200 bg-white text-slate-900'
                : 'border-neutral-800 bg-neutral-900/60'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Your request has been recorded.
                </h3>
                <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                  Thank you for helping shape the roadmap. Multi-user rooms will follow the exact same zero-log, end-to-end encrypted standards.
                </p>
              </div>
            </div>

            <div
              className={`py-4 border-y grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs ${
                isLight ? 'border-slate-200' : 'border-neutral-800'
              }`}
            >
              <div>
                <span className={`block mb-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                  Capacity requested
                </span>
                <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                  {submittedRequest.requestedSize} people
                </span>
              </div>
              <div>
                <span className={`block mb-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                  Primary use case
                </span>
                <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                  {submittedRequest.useCase}
                </span>
              </div>
              <div>
                <span className={`block mb-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                  Date requested
                </span>
                <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                  {new Date(submittedRequest.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {submittedRequest.customDetails && (
              <div className="text-xs">
                <span className={`block mb-1 font-medium ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                  Notes provided:
                </span>
                <p className={`leading-relaxed ${isLight ? 'text-slate-800' : 'text-neutral-300'}`}>
                  {submittedRequest.customDetails}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                Status: Prioritized on roadmap
              </span>
              <button
                type="button"
                onClick={handleResetForm}
                className={`text-xs underline underline-offset-4 cursor-pointer transition-colors font-medium ${
                  isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Submit another request or change size
              </button>
            </div>
          </div>
        ) : (
          /* Clean Professional Request Form */
          <div
            className={`border rounded-2xl p-6 sm:p-8 text-left shadow-xs transition-colors ${
              isLight
                ? 'border-slate-200 bg-white'
                : 'border-neutral-800 bg-neutral-900/60'
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Group Size Selection */}
              <div className="space-y-2.5">
                <label
                  className={`text-xs font-semibold flex items-center justify-between ${
                    isLight ? 'text-slate-800' : 'text-neutral-300'
                  }`}
                >
                  <span>How many people do you need in a single room?</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    {requestedSize} people
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sizeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRequestedSize(opt.value)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        requestedSize === opt.value
                          ? isLight
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-neutral-800 border-emerald-500 text-white'
                          : isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-400'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="pt-1 flex items-center gap-3">
                  <input
                    type="range"
                    min={3}
                    max={50}
                    value={requestedSize}
                    onChange={(e) => setRequestedSize(parseInt(e.target.value, 10))}
                    className={`w-full h-1.5 rounded-lg cursor-pointer ${
                      isLight ? 'accent-emerald-600 bg-slate-200' : 'accent-emerald-400 bg-neutral-800'
                    }`}
                  />
                  <span
                    className={`text-xs font-mono font-bold w-16 text-right ${
                      isLight ? 'text-slate-700' : 'text-neutral-400'
                    }`}
                  >
                    {requestedSize} peers
                  </span>
                </div>
              </div>

              {/* Use Case Selection */}
              <div className="space-y-2">
                <label
                  className={`text-xs font-semibold block ${
                    isLight ? 'text-slate-800' : 'text-neutral-300'
                  }`}
                >
                  What is your primary use case?
                </label>
                <div className="flex flex-wrap gap-2">
                  {useCases.map((uc) => (
                    <button
                      key={uc}
                      type="button"
                      onClick={() => setUseCase(uc)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        useCase === uc
                          ? isLight
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                            : 'bg-neutral-800 border-emerald-500 text-white'
                          : isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                      }`}
                    >
                      {uc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Requirements Note */}
              <div className="space-y-1.5">
                <label
                  htmlFor="group-details-input"
                  className={`text-xs font-semibold block ${
                    isLight ? 'text-slate-800' : 'text-neutral-300'
                  }`}
                >
                  Any specific features or requirements?{' '}
                  <span className={`font-normal ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                    (Optional)
                  </span>
                </label>
                <textarea
                  id="group-details-input"
                  rows={3}
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="e.g., Host moderator controls, simultaneous screen sharing, audio-only mode..."
                  maxLength={500}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all resize-none ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white text-slate-900 placeholder-slate-400'
                      : 'bg-neutral-950 border border-neutral-750 focus:border-emerald-500 text-neutral-100 placeholder-neutral-600'
                  }`}
                />
              </div>

              {/* Optional Contact */}
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-input"
                  className={`text-xs font-semibold block ${
                    isLight ? 'text-slate-800' : 'text-neutral-300'
                  }`}
                >
                  Email or handle for release updates{' '}
                  <span className={`font-normal ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                    (Optional)
                  </span>
                </label>
                <input
                  id="contact-input"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="name@example.com or @handle"
                  maxLength={80}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white text-slate-900 placeholder-slate-400'
                      : 'bg-neutral-950 border border-neutral-750 focus:border-emerald-500 text-neutral-100 placeholder-neutral-600'
                  }`}
                />
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                  Only used to notify you when group rooms launch. Never shared or used for marketing.
                </p>
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-600 font-semibold">{errorMessage}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`font-semibold py-2.5 px-5 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                }`}
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <span>Submit group request</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
