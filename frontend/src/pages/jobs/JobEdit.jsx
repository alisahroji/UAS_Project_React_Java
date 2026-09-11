import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import { useToast } from '../../hooks/useToast';
import { Spinner } from '../../components/ui/Spinner';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { JobFormFields } from './JobCreate';
import { USD_TO_IDR } from '../../utils/format';

export function JobEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: '', description: '', budget: '', deadline: '', requiredSkills: ''
  });
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoadingInitial(true);
        const data = await jobService.getJobById(id);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          budget: data.budget ? Math.round(data.budget * USD_TO_IDR) : '',
          deadline: data.deadline ? data.deadline.split('T')[0] : '',
          requiredSkills: data.requiredSkills ? data.requiredSkills.join(', ') : '',
        });
      } catch (err) {
        setError(err.message || 'Gagal memuat lowongan. Anda mungkin tidak memiliki izin untuk mengedit ini.');
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchJob();
  }, [id]);

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
      await jobService.updateJob(id, payload);
      addToast({ title: 'Proyek Diperbarui', description: 'Perubahan telah disimpan.', variant: 'success' });
      navigate(`/jobs/${id}`);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Page header */}
      <div className="sticky top-20 z-10" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link
            to={`/jobs/${id}`}
            className="inline-flex items-center gap-2 text-sm font-bold mb-6 transition-transform hover:-translate-x-1"
            style={{ color: 'var(--color-primary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Proyek
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-main)' }}>Edit Proyek</h1>
          <p className="text-sm font-medium mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Perbarui detail proyek. Hanya proyek yang masih terbuka yang dapat diedit.
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
               <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            {error}
          </div>
        )}

        {formData.title || !error ? (
          <form onSubmit={handleSubmit}>
            <div
              className="rounded-2xl p-6 sm:p-10 mb-8 shadow-sm"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <JobFormFields formData={formData} onChange={handleChange} loading={loading} />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(`/jobs/${id}`)}
                disabled={loading}
                className="px-6 py-3.5 text-sm font-extrabold rounded-xl border text-center transition-colors hover:bg-gray-50"
                style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 text-sm font-extrabold text-white rounded-xl shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {loading ? 'Menyimpan…' : (
                  <>
                    <Save className="w-4 h-4" /> Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
