import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { USD_TO_IDR } from '../../utils/format';

export function ProposalForm({ onSubmit, submitting = false, initialValues }) {
  const [price, setPrice] = useState(initialValues?.initialPrice ? Math.round(initialValues.initialPrice * USD_TO_IDR) : '');
  const [durationDays, setDurationDays] = useState(initialValues?.initialDurationDays ?? '');
  const [coverLetter, setCoverLetter] = useState(initialValues?.coverLetter ?? '');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = 'Harga penawaran harus berupa angka positif.';
    }

    const durationNum = Number(durationDays);
    if (!durationDays || Number.isNaN(durationNum) || durationNum <= 0) {
      newErrors.durationDays = 'Durasi pengerjaan harus berupa angka positif.';
    }

    const trimmed = coverLetter.trim();
    if (!trimmed) {
      newErrors.coverLetter = 'Surat pengantar wajib diisi.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      initialPrice: Math.round(Number(price) / USD_TO_IDR),
      initialDurationDays: Number(durationDays),
      coverLetter: coverLetter.trim(),
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          id="proposal-price"
          type="number"
          label="Harga Penawaran (USD/Rp)"
          min="1"
          step="1"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={errors.price}
          disabled={submitting}
        />
        <Input
          id="proposal-duration"
          type="number"
          label="Estimasi Durasi (Hari)"
          min="1"
          step="1"
          required
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value)}
          error={errors.durationDays}
          disabled={submitting}
        />
      </div>

      <Textarea
        id="proposal-cover-letter"
        label="Surat Pengantar / Proposal"
        required
        rows={8}
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        error={errors.coverLetter}
        disabled={submitting}
        placeholder="Jelaskan pengalaman Anda, mengapa Anda cocok untuk proyek ini, dan strategi pengerjaannya..."
      />

      <div className="flex justify-end gap-4 pt-4">
        <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
          {submitting ? 'Mengirim...' : 'Kirim Proposal'}
        </Button>
      </div>
    </form>
  );
}