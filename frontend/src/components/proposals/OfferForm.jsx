import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { USD_TO_IDR } from '../../utils/format';

export function OfferForm({ onSubmit, submitting = false, submitLabel = 'Kirim Penawaran Balik', initialValues }) {
  const [price, setPrice] = useState(initialValues?.price ? Math.round(initialValues.price * USD_TO_IDR) : '');
  const [durationDays, setDurationDays] = useState(initialValues?.durationDays ?? '');
  const [message, setMessage] = useState(initialValues?.message ?? '');
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

    const trimmed = message.trim();
    if (!trimmed) {
      newErrors.message = 'Pesan negosiasi wajib diisi.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      price: Math.round(Number(price) / USD_TO_IDR),
      durationDays: Number(durationDays),
      message: message.trim(),
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          id="offer-price"
          type="number"
          label="Harga Penawaran Baru (USD/Rp)"
          min="1"
          step="1"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={errors.price}
          disabled={submitting}
        />
        <Input
          id="offer-duration"
          type="number"
          label="Estimasi Durasi Baru (Hari)"
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
        id="offer-message"
        label="Pesan Negosiasi"
        required
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        error={errors.message}
        disabled={submitting}
        placeholder="Berikan alasan atas penawaran balik Anda..."
      />

      <div className="flex justify-end gap-4 pt-4">
        <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
          {submitting ? 'Mengirim...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}