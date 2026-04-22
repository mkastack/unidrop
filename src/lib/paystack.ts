/**
 * Paystack Integration Helper
 * Using the public key from environment variables.
 */

export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder";

export const getPaystackConfig = (email: string, amount: number, callback: (ref: any) => void, onExclude?: () => void) => {
  return {
    email,
    amount: Math.round(amount * 100), // convert to pesewas/kobo
    publicKey: PAYSTACK_PUBLIC_KEY,
    text: "Pay with Paystack",
    onSuccess: callback,
    onClose: onExclude || (() => {}),
    currency: "GHS",
  };
};
