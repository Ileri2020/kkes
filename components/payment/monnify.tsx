'use client';

import * as React from 'react';
import { useMonnifyPayment } from 'react-monnify-2';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';

type MonnifyPaymentButtonProps = {
  amount: number;
  currency?: string;
  email: string;
  phoneNumber?: string;
  name: string;
  reference: string;
  disabled?: boolean;
  onSuccess?: (response: any) => void;
  onFailure?: (error: any) => void;
};

const MonnifyPaymentButton = React.forwardRef<HTMLButtonElement, MonnifyPaymentButtonProps>(({
  amount,
  currency = 'NGN',
  email,
  phoneNumber = '',
  name,
  reference,
  disabled = false,
  onSuccess,
  onFailure,
}, ref) => {
  const config = React.useMemo(() => ({
    amount: Number(amount),
    currency,
    reference,
    customerFullName: name,
    customerEmail: email,
    customerMobileNumber: phoneNumber,
    apiKey: process.env.NEXT_PUBLIC_MONNIFY_API_KEY as string,
    contractCode: process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE as string,
    isTestMode: process.env.NEXT_PUBLIC_MONNIFY_IS_TEST_MODE === 'true',
    paymentDescription: 'HealthClique cart payment',
  }), [amount, currency, reference, name, email, phoneNumber]);

  const initializePayment = useMonnifyPayment(config);

  const handlePayment = () => {
    if (disabled) return;

    if (!process.env.NEXT_PUBLIC_MONNIFY_API_KEY || !process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE) {
      toast.error('Monnify config missing. Check your env variables.');
      onFailure?.({ error: 'Missing Monnify keys' });
      return;
    }

    initializePayment(
      (response: any) => {
        toast.success('Monnify payment successful!');
        onSuccess?.(response);
      },
      (closeData: any) => {
        if (closeData && closeData.status === 'cancelled') {
          toast.error('Monnify payment cancelled');
        }
        onFailure?.(closeData);
      }
    );
  };

  return (
    <Button
      ref={ref}
      disabled={disabled}
      onClick={handlePayment}
      type="button"
      className="w-full h-12 rounded-xl font-bold border-2 z-50 hover:scale-[1.02] transition-transform shadow-lg shadow-blue-500/10"
      variant="outline"
    >
      <CreditCard className="mr-2 h-4 w-4 text-blue-600" />
      Payment Gateway
    </Button>
  );
});

MonnifyPaymentButton.displayName = "MonnifyPaymentButton";
export default MonnifyPaymentButton;
