import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard } from 'lucide-react';
import { formatINR } from '../utils/currency';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Destructure with fallbacks if accessed directly without state
  const gig = location.state?.gig || { title: 'Sample Gig' };
  const selectedPackage = location.state?.package || { price: 15000, name: 'Basic' };

  const serviceFee = (selectedPackage.price * 0.05).toFixed(2); // 5% fee
  const total = (parseFloat(selectedPackage.price) + parseFloat(serviceFee)).toFixed(2);

  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      alert('Payment successful! Order created.');
      navigate('/');
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Payment Details */}
        <div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <CreditCard className="mr-2 text-brand-600" /> Payment Method
            </h2>
            <form onSubmit={handlePayment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <input type="text" placeholder="0000 0000 0000 0000" className="w-full border rounded-md p-3 focus:ring-brand-500 focus:border-brand-500 outline-none" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                    <input type="text" placeholder="MM/YY" className="w-full border rounded-md p-3 focus:ring-brand-500 focus:border-brand-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Security Code</label>
                    <input type="text" placeholder="CVC" className="w-full border rounded-md p-3 focus:ring-brand-500 focus:border-brand-500 outline-none" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                  <input type="text" placeholder="Name on card" className="w-full border rounded-md p-3 focus:ring-brand-500 focus:border-brand-500 outline-none" required />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isProcessing}
                className={`w-full mt-6 text-white font-bold py-4 rounded-md transition flex items-center justify-center ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'}`}
              >
                {isProcessing ? 'Processing...' : `Confirm & Pay ${formatINR(total)}`}
              </button>
            </form>
          </div>

          <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
            <ShieldCheck className="w-8 h-8 text-green-500 mr-3 flex-shrink-0" />
            <p>
              SSL Secured Checkout. Your payment information is encrypted and securely processed.
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="flex space-x-4 mb-6 pb-6 border-b">
              <div className="w-24 h-16 bg-gray-200 rounded flex-shrink-0"></div>
              <div>
                <h3 className="font-semibold text-gray-900 leading-tight">{gig.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedPackage.name} Package</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatINR(selectedPackage.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service Fee</span>
                <span className="font-medium">{formatINR(serviceFee)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-lg font-bold mb-6">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>

            <div className="text-xs text-gray-500 text-center">
              By placing your order, you agree to GigSphere's Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
