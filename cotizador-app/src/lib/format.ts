export const toMoney = (amount: number, currency: 'MXN' | 'USD'): string => {
  const locale = currency === 'USD' ? 'en-US' : 'es-MX';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0);
};

export const padItemId = (index: number): string => String(index + 1).padStart(2, '0');

export const clampNumber = (value: number, min: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.max(value, min);
};

export const safeText = (value: string, fallback = '-'): string => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export const readImageAsDataUrl = async (file: File): Promise<string> => {
  const maxSizeInBytes = 2 * 1024 * 1024;
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen.');
  }
  if (file.size > maxSizeInBytes) {
    throw new Error('La imagen excede 2MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('No se pudo leer la imagen.'));
    };
    reader.onerror = () => reject(new Error('Error al leer la imagen.'));
    reader.readAsDataURL(file);
  });
};
