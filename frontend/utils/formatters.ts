/**
 * Convierte un valor en centavos a formato de moneda local.
 * @param cents Monto en centavos (ej. 10001)
 * @returns Cadena formateada (ej. $100.01)
 */
export function formatCurrencyFromCents(cents: number): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convierte un monto decimal a centavos (integer) de forma segura.
 * Utiliza Number.EPSILON para mitigar los problemas clásicos de 
 * precisión de punto flotante en JavaScript (ej. 1.005 * 100 = 100.49999999999999).
 * @param amount Monto en formato decimal (ej. 100.01)
 * @returns Monto en centavos, garantizado como entero (ej. 10001)
 */
export function convertToCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100);
}
