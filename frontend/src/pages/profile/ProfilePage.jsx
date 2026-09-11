import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Star, Mail, Briefcase, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { reviewService } from '../../services/reviewService';
import { ReviewStars } from '../../components/projects/ReviewStars';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { Badge } from '../../components/ui/Badge';
import { formatDateID } from '../../utils/format';

/**
 * Read-only Profile page (Step 8).
 *
 * Data sources (backend-authoritative, no mocks):
 * - Identity: AuthProvider (GET /api/auth/me -> UserDto: id, name, email, role, bio, skills, avatarUrl).
 *   There is no GET /api/users/{id}/profile endpoint in the backend, so other-user profiles
 *   are intentionally not supported (route /profile/:id shows a clean "not available" state
 *   unless the id belongs to the current user).
 * - Reputation: GET /api/users/{userId}/reviews via reviewService (requires JWT in practice —
 *   documented quirk; api.js attaches the token automatically).
 * - Average rating is a display-only aggregate computed from raw backend reviews
 *   (the backend exposes no authoritative aggregation endpoint).
 */
export function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { id: routeId } = useParams();

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);
  const [bioRefreshing, setBioRefreshing] = useState(false);

  const isOwnProfile = !routeId || (user && routeId === user.id);
  const profile = isOwnProfile ? user : null;
  const profileId = profile ? profile.id : null;

  const loadReviews = useCallback(async () => {
    if (!profileId) return;
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const data = await reviewService.getUserReviews(profileId);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401) setReviewsError('Sesi Anda telah berakhir. Silakan login kembali.');
      else if (err.status === 403) setReviewsError('Ulasan tidak dapat diakses untuk akun ini.');
      else setReviewsError(err.message || 'Gagal memuat ulasan.');
    } finally {
      setReviewsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (isOwnProfile) loadReviews();
  }, [isOwnProfile, loadReviews]);

  // Display-only aggregate (backend provides raw reviews only)
  const { averageRating, reviewCount } = useMemo(() => {
    const count = reviews.length;
    if (count === 0) return { averageRating: null, reviewCount: 0 };
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return { averageRating: sum / count, reviewCount: count };
  }, [reviews]);

  if (!authLoading && !user) {
    // Protected in practice (route is wrapped in ProtectedRoute); defensive fallback
    return <Navigate to="/login" replace />;
  }

  if (authLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isOwnProfile) {
    // Backend has no GET /api/users/{id}/profile — other-user profiles are not supported (documented).
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
         <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="h-8 w-8 text-gray-400" />
         </div>
         <h1 className="text-xl font-extrabold mb-2" style={{ color: 'var(--color-text-main)' }}>Profil Tidak Tersedia</h1>
         <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Melihat profil pengguna lain belum didukung dalam sistem saat ini.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Back nav space (Optional, kept clean for profile) */}
      <div className="h-8"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div
          className="rounded-2xl p-6 sm:p-10 mb-8"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-extrabold uppercase shrink-0 shadow-sm"
              style={{ backgroundColor: 'rgba(217,30,46,0.08)', color: 'var(--color-primary)', border: '2px solid rgba(217,30,46,0.15)' }}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                (profile.name || 'U').charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <h1 className="text-3xl font-extrabold truncate mb-2" style={{ color: 'var(--color-text-main)' }}>{profile.name || 'Pengguna Tanpa Nama'}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={profile.role === 'FREELANCER' ? 'info' : 'warning'}>
                  {profile.role === 'FREELANCER' ? 'DEVELOPER' : 'KLIEN'}
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                  <Mail className="w-4 h-4" /> {profile.email}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-[11px] font-extrabold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>Tentang Saya</h2>
              <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--color-text-main)' }}>
                {profile.bio ? profile.bio : (
                  <span className="italic text-gray-400">Belum ada bio yang ditulis.</span>
                )}
              </p>
            </div>

            <div>
              <h2 className="text-[11px] font-extrabold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>Keahlian</h2>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-main)', border: '1px solid var(--color-border)' }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium italic text-gray-400">Belum ada keahlian.</p>
              )}
            </div>
          </div>
        </div>

        {/* Reputation summary */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
        >
          <div className="flex items-center gap-5">
            <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex items-center justify-center shrink-0">
              <Star className="w-8 h-8" style={{ color: averageRating ? '#f59e0b' : '#d1d5db', fill: averageRating ? '#f59e0b' : 'transparent' }} />
            </div>
            {reviewsLoading ? (
              <Spinner size="sm" />
            ) : averageRating != null ? (
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl font-extrabold" style={{ color: 'var(--color-text-main)' }}>{averageRating.toFixed(1)}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>/ 5.0</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <ReviewStars value={Math.round(averageRating)} size="w-4 h-4" />
                  <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                    Berdasarkan {reviewCount} ulasan
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-extrabold" style={{ color: 'var(--color-text-main)' }}>Belum Ada Ulasan</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Reputasi akan muncul setelah proyek diselesaikan.</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm font-bold bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-100 shrink-0">
            <ShieldCheck className="w-4 h-4" />
            Akun {profile.role === 'FREELANCER' ? 'Developer' : 'Klien'} Terverifikasi
          </div>
        </div>

        {/* Reviews list */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4" style={{ borderBottom: '2px solid var(--color-border)' }}>
            <h2 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: 'var(--color-text-main)' }}>Ulasan Diterima</h2>
            <button
              type="button"
              onClick={async () => { setBioRefreshing(true); await refreshUser(); setBioRefreshing(false); }}
              disabled={bioRefreshing}
              className="text-xs font-bold transition-colors disabled:opacity-50"
              style={{ color: 'var(--color-primary)' }}
            >
              {bioRefreshing ? 'Menyegarkan…' : 'Segarkan Profil'}
            </button>
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center py-12"><Spinner size="md" /></div>
          ) : reviewsError ? (
            <ErrorState title="Gagal memuat ulasan" message={reviewsError} onRetry={loadReviews} />
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
               <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                Belum ada ulasan yang diterima. <br/>Selesaikan proyek untuk membangun reputasi Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl p-5 transition-shadow hover:shadow-sm"
                  style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold uppercase shrink-0 shadow-sm"
                        style={{ backgroundColor: 'rgba(217,30,46,0.08)', color: 'var(--color-primary)', border: '1px solid rgba(217,30,46,0.18)' }}
                      >
                        {(review.reviewerName || 'R').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold truncate" style={{ color: 'var(--color-text-main)' }}>{review.reviewerName || 'Pengulas'}</div>
                        <div className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{formatDateID(review.createdAt)}</div>
                      </div>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm self-start sm:self-auto shrink-0">
                        <ReviewStars value={review.rating} size="w-3.5 h-3.5" />
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm leading-relaxed font-medium mt-3" style={{ color: 'var(--color-text-main)' }}>"{review.comment}"</p>
                  )}
                  {review.projectId && (
                    <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <Link
                        to={`/projects/${review.projectId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold transition-all hover:opacity-80"
                        style={{ color: 'var(--color-primary)' }}
                        >
                        <Briefcase className="w-3.5 h-3.5" /> Lihat Proyek
                        </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
