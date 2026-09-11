import React, { useState, useEffect, useCallback } from 'react';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ReviewStars } from './ReviewStars';
import { formatDate } from './projectFormat';
import { Spinner } from '../ui/Spinner';
import { Star, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

/**
 * Review section for a project detail page.
 *
 * Eligibility (mirrors backend rules; backend stays authoritative):
 * - Reviews exist only for COMPLETED projects (else 409 from backend).
 * - Only the two participants can read/submit (else 403 from backend).
 * - reviewee is always the OTHER participant; duplicate (project+reviewer+reviewee) -> 409.
 */
export function ReviewSection({ project }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false); // my review exists after successful submit

  const isCompleted = project.status === 'COMPLETED';
  const isParticipant = !!user && (user.id === project.clientId || user.id === project.freelancerId);
  const myReview = reviews.find((r) => user && r.reviewerId === user.id);
  const hasReviewed = !!myReview || submitted;

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await reviewService.getProjectReviews(project.id);
      setReviews(data || []);
    } catch (err) {
      if (err.status === 403) setLoadError('Reviews are only visible to project participants.');
      else if (err.status === 404) setLoadError('Project not found.');
      else setLoadError(err.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleToggle = (value) => setRating((prev) => (prev === value ? 0 : value));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!rating || rating < 1 || rating > 5) {
      setFormError('Please select a rating from 1 to 5 stars.');
      return;
    }
    if (!comment.trim()) {
      setFormError('Please write a short comment.');
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await reviewService.createReview(project.id, { rating, comment: comment.trim() });
      addToast({ title: 'Review submitted', description: 'Thank you for your feedback!', variant: 'success' });
      setRating(0);
      setComment('');
      setSubmitted(true);
      await loadReviews(); // refresh from backend, no browser reload
    } catch (err) {
      if (err.status === 409) addToast({ title: 'Already reviewed', description: err.message || 'You have already reviewed this user for this project.', variant: 'error' });
      else if (err.status === 403) addToast({ title: 'Not allowed', description: err.message || 'Only project participants can submit a review.', variant: 'error' });
      else if (err.status === 401) addToast({ title: 'Please sign in', description: 'Your session has expired. Please sign in again.', variant: 'error' });
      else if (err.status === 400) addToast({ title: 'Invalid review', description: err.message || 'Please check your rating and comment.', variant: 'error' });
      else addToast({ title: 'Failed', description: err.message || 'Could not submit review.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
        Reviews
      </h2>

      {/* Existing reviews */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="md" /></div>
      ) : loadError ? (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{loadError}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
          {isCompleted ? 'No reviews yet.' : 'Reviews become available after the project is completed.'}
        </p>
      ) : (
        <div className="space-y-4 mb-2">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0"
                    style={{ backgroundColor: 'rgba(217,30,46,0.08)', color: 'var(--color-primary)', border: '1px solid rgba(217,30,46,0.18)' }}
                  >
                    {(review.reviewerName || 'R').charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                      {review.reviewerName || 'Reviewer'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      reviewed {review.revieweeName || 'participant'} · {formatDate(review.createdAt)}
                    </div>
                  </div>
                </div>
                <ReviewStars value={review.rating} size="w-4 h-4" />
              </div>
              {review.comment && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-main)' }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submission form */}
      {isCompleted && isParticipant && !hasReviewed && !loadError && (
        <form onSubmit={handleSubmit} className="mt-5 pt-5" style={{ borderTop: '1px solid var(--color-border)' }} noValidate>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-main)' }}>
            Leave a review for {user?.id === project.clientId ? project.freelancerName : project.clientName}
          </h3>
          <div className="mb-3">
            <ReviewStars value={rating} onChange={handleToggle} disabled={submitting} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => { setComment(e.target.value); setFormError(null); }}
            rows={3}
            placeholder="Share your experience working together…"
            disabled={submitting}
            className="w-full resize-none rounded-lg px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2"
            style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-main)', borderColor: 'var(--color-border)' }}
          />
          {formError && (
            <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
              <AlertCircle className="w-3.5 h-3.5" /> {formError}
            </p>
          )}
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={submitting || !rating || !comment.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Star className="w-4 h-4" />
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviewed state */}
      {isCompleted && isParticipant && hasReviewed && (
        <div className="mt-5 pt-5 flex items-center gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--color-success)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
              You reviewed {myReview ? myReview.revieweeName : user?.id === project.clientId ? project.freelancerName : project.clientName}
            </p>
            {myReview && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Your rating: {myReview.rating}/5{myReview.comment ? ` — "${myReview.comment}"` : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Non-completed hint for participants */}
      {!isCompleted && isParticipant && !loadError && (
        <p className="mt-4 pt-4 text-xs flex items-center gap-1.5" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          <Lock className="w-3.5 h-3.5" />
          Reviews unlock when the project is completed.
        </p>
      )}
    </div>
  );
}
