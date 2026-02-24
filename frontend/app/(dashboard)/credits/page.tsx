'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Coins, 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Zap,
  Crown,
  Sparkles,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  getCreditPackages, 
  getCreditBalance, 
  getCreditHistory,
  initializePayment,
  verifyPayment,
  CreditPackage,
  CreditBalance,
  CreditTransaction
} from '@/lib/paystack';

export default function CreditsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [verifyMessage, setVerifyMessage] = useState('');

  // Check for payment verification on mount
  useEffect(() => {
    const reference = searchParams.get('reference');
    const verify = searchParams.get('verify');
    
    if (reference) {
      handleVerifyPayment(reference);
    } else if (verify) {
      // User returned from Paystack without reference (cancelled or error)
      toast({
        title: "Payment Status",
        description: "Please check your balance. If payment was successful, credits will be added.",
      });
      // Clean up URL
      router.replace('/credits');
    }
  }, [searchParams]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packagesData, balanceData, historyData] = await Promise.all([
        getCreditPackages(),
        getCreditBalance(),
        getCreditHistory(1, 5),
      ]);
      setPackages(packagesData);
      setBalance(balanceData);
      setTransactions(historyData.transactions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load credits data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    setPurchasing(pkg.slug);
    try {
      const response = await initializePayment(pkg.slug);
      // Redirect to Paystack
      window.location.href = response.authorization_url;
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      setPurchasing(null);
    }
  };

  const handleVerifyPayment = async (reference: string) => {
    setShowVerifyDialog(true);
    setVerifyStatus('loading');
    setVerifyMessage('Verifying your payment...');
    
    try {
      const result = await verifyPayment(reference);
      
      if (result.success) {
        setVerifyStatus('success');
        setVerifyMessage(`Payment successful! ${result.credits_added} credits added to your account.`);
        // Refresh balance
        const newBalance = await getCreditBalance();
        setBalance(newBalance);
        toast({
          title: "Payment Successful!",
          description: `${result.credits_added} credits added. New balance: ${result.new_balance}`,
        });
      } else {
        setVerifyStatus('error');
        setVerifyMessage(result.message || 'Payment verification failed.');
        toast({
          title: "Payment Failed",
          description: result.message || "Could not verify payment. Please contact support.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setVerifyStatus('error');
      setVerifyMessage(error.message || 'An error occurred during verification.');
      toast({
        title: "Verification Error",
        description: error.message || "Could not verify payment.",
        variant: "destructive",
      });
    }
    
    // Clean up URL
    router.replace('/credits');
  };

  const getIconForPackage = (slug: string) => {
    switch (slug) {
      case 'starter':
        return <Coins className="w-8 h-8 text-amber-500" />;
      case 'pro':
        return <Zap className="w-8 h-8 text-blue-500" />;
      case 'premium':
        return <Crown className="w-8 h-8 text-purple-500" />;
      default:
        return <Sparkles className="w-8 h-8 text-wood" />;
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="default" className="bg-green-500">Purchase</Badge>;
      case 'usage':
        return <Badge variant="secondary">Used</Badge>;
      case 'bonus':
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Bonus</Badge>;
      case 'refund':
        return <Badge variant="outline" className="border-red-500 text-red-600">Refund</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-wood" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal mb-2">Credits</h1>
        <p className="text-gray-500">Purchase credits to access interviews and presentations</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-wood to-wood-dark text-white border-none">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Current Balance</p>
              <h2 className="text-5xl font-bold">
                {balance?.balance.toLocaleString() || 0}
              </h2>
              <p className="text-white/60 text-sm mt-2">credits available</p>
            </div>
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
              <Coins className="w-10 h-10 text-white" />
            </div>
          </div>
          {balance && balance.lifetime_earned > 0 && (
            <div className="mt-6 pt-6 border-t border-white/20 flex gap-8">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider">Lifetime Earned</p>
                <p className="text-xl font-semibold">{balance.lifetime_earned.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider">Lifetime Used</p>
                <p className="text-xl font-semibold">{balance.lifetime_used.toLocaleString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div>
        <h2 className="text-xl font-semibold text-charcoal mb-4">Purchase Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative overflow-hidden ${pkg.is_popular ? 'ring-2 ring-wood shadow-lg' : ''}`}
            >
              {pkg.is_popular && (
                <div className="absolute top-0 right-0 bg-wood text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  {getIconForPackage(pkg.slug)}
                  <div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <p className="text-gray-500 text-sm">{pkg.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-charcoal">₦{pkg.price_naira.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Base Credits</span>
                    <span className="font-medium">{pkg.credits_amount.toLocaleString()}</span>
                  </div>
                  {pkg.bonus_credits > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Bonus Credits</span>
                      <span className="font-medium">+{pkg.bonus_credits.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold">Total Credits</span>
                    <span className="font-bold text-lg">{pkg.total_credits.toLocaleString()}</span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasing === pkg.slug}
                  className={`w-full ${pkg.is_popular ? 'bg-wood hover:bg-wood-dark' : ''}`}
                >
                  {purchasing === pkg.slug ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Buy Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-charcoal">Recent Transactions</h2>
          <Button variant="ghost" size="sm" className="text-wood">
            <History className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Coins className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Your credit transactions will appear here</p>
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.transaction_type === 'purchase' ? 'bg-green-100 text-green-600' :
                        tx.transaction_type === 'usage' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {tx.transaction_type === 'purchase' ? <CheckCircle className="w-5 h-5" /> :
                         tx.transaction_type === 'usage' ? <Coins className="w-5 h-5" /> :
                         <Sparkles className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-charcoal">
                          {tx.description || tx.package_name || 'Credit Transaction'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        tx.transaction_type === 'usage' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {tx.transaction_type === 'usage' ? '-' : '+'}{tx.amount.toLocaleString()}
                      </p>
                      {formatTransactionType(tx.transaction_type)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyStatus === 'loading' ? 'Verifying Payment' : 
               verifyStatus === 'success' ? 'Payment Successful!' : 'Payment Failed'}
            </DialogTitle>
            <DialogDescription>{verifyMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            {verifyStatus === 'loading' && (
              <Loader2 className="w-16 h-16 animate-spin text-wood" />
            )}
            {verifyStatus === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-500" />
            )}
            {verifyStatus === 'error' && (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          {verifyStatus !== 'loading' && (
            <Button onClick={() => setShowVerifyDialog(false)} className="w-full">
              Close
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
