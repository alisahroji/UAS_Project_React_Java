import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { USD_TO_IDR } from '../../utils/format';

export function JobFormFields({ formData, onChange, loading }) {
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text-main)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.01)',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-text-muted)',
    marginBottom: '8px',
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <label htmlFor="title" style={labelStyle}>Judul Proyek <span className="text-red-500">*</span></label>
          <input
            id="title"
            name="title"
            value={formData.title}
            onChange={onChange}
            required
            disabled={loading}
            placeholder="Cth: Buat Platform E-Commerce dengan React"
            style={inputStyle}
            onFocus={e => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.boxShadow = '0 0 0 4px rgba(217,30,46,0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--color-border)';
              e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.01)';
            }}
          />
        </div>

        <div>
          <label htmlFor="description" style={labelStyle}>Deskripsi Proyek <span className="text-red-500">*</span></label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onChange}
            required
            disabled={loading}
            rows={8}
            placeholder="Jelaskan ruang lingkup proyek, target hasil, dan persyaratan teknis secara detail..."
            style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: '1.6' }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.boxShadow = '0 0 0 4px rgba(217,30,46,0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--color-border)';
              e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.01)';
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="budget" style={labelStyle}>Anggaran (Rp) <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
              <input
                id="budget"
                name="budget"
                type="number"
                min="10000"
                step="10000"
                value={formData.budget}
                onChange={onChange}
                required
                disabled={loading}
                placeholder="Cth: 5000000"
                style={{ ...inputStyle, paddingLeft: '44px' }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(217,30,46,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--color-border)';
                  e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.01)';
                }}
              />
            </div>
          </div>
          <div>
            <label htmlFor="deadline" style={labelStyle}>Tenggat Waktu <span className="text-red-500">*</span></label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={onChange}
              required
              disabled={loading}
              style={{ ...inputStyle, colorScheme: 'light' }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 4px rgba(217,30,46,0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.01)';
              }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="requiredSkills" style={labelStyle}>Keahlian yang Dibutuhkan</label>
          <input
            id="requiredSkills"
            name="requiredSkills"
            value={formData.requiredSkills}
            onChange={onChange}
            disabled={loading}
            placeholder="React, Node.js, PostgreSQL, TypeScript"
            style={inputStyle}
            onFocus={e => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.boxShadow = '0 0 0 4px rgba(217,30,46,0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--color-border)';
              e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.01)';
            }}
          />
          <p className="mt-2 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Pisahkan setiap keahlian dengan koma (,)
          </p>
        </div>
      </div>
    </>
  );
}

export function JobCreate() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: '', description: '', budget: '', deadline: '', requiredSkills: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: Math.round(parseFloat(formData.budget) / USD_TO_IDR),
        deadline: formData.deadline,
        requiredSkills: formData.requiredSkills
          ? formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };
      const newJob = await jobService.createJob(payload);
      addToast({ title: 'Proyek Dipublikasikan', description: 'Lowongan Anda sekarang sudah aktif.', variant: 'success' });
      navigate(`/jobs/${newJob.id}`);
    } catch (err) {
      setError(err.message || 'Gagal mempublikasikan. Silakan periksa kembali isian Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Page header */}
      <div className="sticky top-20 z-10" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-sm font-bold mb-6 transition-transform hover:-translate-x-1"
            style={{ color: 'var(--color-primary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Marketplace
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-main)' }}>Posting Proyek Baru</h1>
          <p className="text-sm font-medium mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Jelaskan proyek Anda dengan detail untuk menarik developer terbaik.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div
            className="p-4 rounded-xl text-sm font-bold mb-8 flex items-center gap-3"
            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
          >
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
               <span className="text-red-500 text-lg">!</span>
            </div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            className="rounded-2xl p-6 sm:p-10 mb-8 shadow-sm"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <JobFormFields formData={formData} onChange={handleChange} loading={loading} />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <Link
              to="/jobs"
              className="px-6 py-3.5 text-sm font-extrabold rounded-xl border text-center transition-colors hover:bg-gray-50"
              style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 text-sm font-extrabold text-white rounded-xl shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading ? 'Mempublikasikan…' : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Publikasikan Proyek
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
