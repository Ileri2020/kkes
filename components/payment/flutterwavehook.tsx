'use client';

import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { Button } from '@/components/ui/button';

type FlutterwaveButtonHookProps = {
  amount: number;
  currency: string;
  email: string;
  phone_number: string;
  name: string;
  tx_ref: string;
  disabled?: boolean;
  onSuccess: (response: any) => void;
  onFailure?: (response: any) => void;
};

export default function FlutterWaveButtonHook({
  amount,
  currency,
  email,
  phone_number,
  name,
  tx_ref,
  disabled = false,
  onSuccess,
  onFailure,
}: FlutterwaveButtonHookProps) {
  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY as string,
    tx_ref,
    amount,
    currency,
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email,
      phone_number,
      name,
    },
    customizations: {
      title: 'Loyz Food and Spices',
      description: 'Payment for items in cart using Flutterwave',
      logo: 'https://res.cloudinary.com/dc5khnuiu/image/upload/v1765733238/j8jw0lwd79tuhofhpao9.png',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  return (
    <Button
      disabled={disabled}
      onClick={() => {
        if (disabled) return;

        handleFlutterPayment({
          callback: (response: any) => {
            if (response?.status === 'successful') {
              onSuccess(response);
            } else {
              onFailure?.(response);
            }

            closePaymentModal();
          },
          onClose: () => {},
        });
      }}
    >
      Checkout
    </Button>
  );
}
