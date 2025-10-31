/**
 * Example usage of PaymentCheckout component
 * 
 * This file demonstrates how to integrate the PaymentCheckout component
 * into your application for subscription and credit purchases.
 */

import React, { useState } from 'react';
import { PaymentCheckout } from './PaymentCheckout';
import { SUBSCRIPTION_PLANS, CREDIT_PACKAGES } from '../types';

export const PaymentCheckoutExample: React.FC = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof SUBSCRIPTION_PLANS[0] | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<typeof CREDIT_PACKAGES[0] | null>(null);

  // Example user ID (in real app, get from auth context)
  const userId = 'example-user-id';

  const handlePlanSelect = (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    setSelectedPlan(plan);
    setSelectedPackage(null);
    setShowCheckout(true);
  };

  const handlePackageSelect = (pkg: typeof CREDIT_PACKAGES[0]) => {
    setSelectedPackage(pkg);
    setSelectedPlan(null);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    console.log('Payment successful!', transactionId);
    setShowCheckout(false);
    // Handle success: activate subscription, add credits, show success message, etc.
  };

  const handlePaymentCancel = () => {
    console.log('Payment cancelled');
    setShowCheckout(false);
    setSelectedPlan(null);
    setSelectedPackage(null);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Show error toast/notification to user
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Payment Checkout Example</h1>

      {/* Subscription Plans */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold mb-2">{plan.displayName}</h3>
              <p className="text-3xl font-bold mb-4">
                ₺{plan.price}
                <span className="text-sm font-normal">/ay</span>
              </p>
              <ul className="space-y-2 mb-6">
                <li>✓ {plan.monthlyQuota} görüntü/ay</li>
                <li>✓ {plan.features.maxResolution}px çözünürlük</li>
                <li>
                  {plan.features.hasWatermark ? '✗ Filigran var' : '✓ Filigransız'}
                </li>
                <li>
                  ✓ {plan.features.queuePriority === 'high' ? 'Öncelikli' : 'Standart'} işleme
                </li>
              </ul>
              <button
                onClick={() => handlePlanSelect(plan)}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Planı Seç
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Credit Packages */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Credit Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
              <p className="text-3xl font-bold mb-4">₺{pkg.price}</p>
              <ul className="space-y-2 mb-6">
                <li>✓ {pkg.credits} görüntü kredisi</li>
                <li>✓ ₺{pkg.pricePerImage.toFixed(2)}/görüntü</li>
              </ul>
              <button
                onClick={() => handlePackageSelect(pkg)}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Satın Al
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Checkout Modal */}
      {showCheckout && (
        <PaymentCheckout
          userId={userId}
          plan={selectedPlan || undefined}
          creditPackage={selectedPackage || undefined}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
          onError={handlePaymentError}
        />
      )}
    </div>
  );
};
