// Fonctions utilitaires pour DealForm

export function calculateDiscount(original, deal) {
  const orig = parseFloat(original) || 0;
  const dealPrice = parseFloat(deal) || 0;
  if (orig > 0 && dealPrice > 0 && dealPrice < orig) {
    return Math.round(((orig - dealPrice) / orig) * 100 * 100) / 100;
  }
  return 0;
}

export function validateDates(startDate, endDate) {
  if (!startDate || !endDate) {
    return "Les dates de début et fin sont requises";
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  const maxDuration = 28 * 24 * 60 * 60 * 1000;
  if (start < now) {
    return "La date de début ne peut pas être dans le passé";
  }
  if (end <= start) {
    return "La date de fin doit être après la date de début";
  }
  if (end - start > maxDuration) {
    return "La durée de l'offre ne peut pas dépasser 4 semaines";
  }
  return null;
}
