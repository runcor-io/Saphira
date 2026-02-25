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
  History,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        return <Coins className="w-8 h-8 text-amber-400" />;
      case 'pro':
        return <Zap className="w-8 h-8 text-blue-400" />;
      case 'premium':
        return <Crown className="w-8 h-8 text-purple-400" />;
      default:
        return <Sparkles className="w-8 h-8 text-[#D2B48C]" />;
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Purchase</Badge>;
      case 'usage':
        return <Badge className="bg-white/10 text-white/60 border-white/20">Used</Badge>;
      case 'bonus':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Bonus</Badge>;
      case 'refund':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Refund</Badge>;
      default:
        return <Badge className="bg-white/10 text-white/60 border-white/20">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8B5A2B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </button>
            <div>
              <h1 className="text-white font-semibold">Credits</h1>
              <p className="text-white/50 text-sm">Purchase credits to access interviews and presentations</p>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-[#8B5A2B] to-[#6B4423] rounded-2xl p-8 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Current Balance</p>
                  <h2 className="text-5xl font-bold text-white">
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
                    <p className="text-xl font-semibold text-white">{balance.lifetime_earned.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wider">Lifetime Used</p>
                    <p className="text-xl font-semibold text-white">{balance.lifetime_used.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Credit Packages */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Purchase Credits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div 
                    key={pkg.id} 
                    className={`relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 transition-all hover:border-white/20 ${pkg.is_popular ? 'ring-2 ring-[#8B5A2B]' : ''}`}
                  >
                    {pkg.is_popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                        Most Popular
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {getIconForPackage(pkg.slug)}
                        <div>
                          <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                          <p className="text-white/50 text-sm">{pkg.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-bold text-white">₦{pkg.price_naira.toLocaleString()}</span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Base Credits</span>
                          <span className="font-medium text-white">{pkg.credits_amount.toLocaleString()}</span>
                        </div>
                        {pkg.bonus_credits > 0 && (
                          <div className="flex items-center justify-between text-emerald-400">
                            <span>Bonus Credits</span>
                            <span className="font-medium">+{pkg.bonus_credits.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                          <span className="font-semibold text-white">Total Credits</span>
                          <span className="font-bold text-lg text-white">{pkg.total_credits.toLocaleString()}</span>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-white/60">
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Button 
                        onClick={() => handlePurchase(pkg)}
                        disabled={purchasing === pkg.slug}
                        className={`w-full ${pkg.is_popular ? 'bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] hover:shadow-lg hover:shadow-[#8B5A2B]/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
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
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
                <Button variant="ghost" size="sm" className="text-[#D2B48C] hover:text-[#8B5A2B] hover:bg-white/5">
                  <History className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center">
                    <Coins className="w-12 h-12 mx-auto mb-3 text-white/20" />
                    <p className="text-white/50">No transactions yet</p>
                    <p className="text-sm text-white/40 mt-1">Your credit transactions will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.transaction_type === 'purchase' ? 'bg-emerald-500/20 text-emerald-400' :
                            tx.transaction_type === 'usage' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {tx.transaction_type === 'purchase' ? <CheckCircle className="w-5 h-5" /> :
                             tx.transaction_type === 'usage' ? <Coins className="w-5 h-5" /> :
                             <Sparkles className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {tx.description || tx.package_name || 'Credit Transaction'}
                            </p>
                            <p className="text-sm text-white/40">
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
                            tx.transaction_type === 'usage' ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {tx.transaction_type === 'usage' ? '-' : '+'}{tx.amount.toLocaleString()}
                          </p>
                          {formatTransactionType(tx.transaction_type)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Dialog */}
        <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
      <DialogContent className="bg-[#1a1a1f] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {verifyStatus === 'loading' ? 'Verifying Payment' : 
             verifyStatus === 'success' ? 'Payment Successful!' : 'Payment Failed'}
          </DialogTitle>
          <DialogDescription className="text-white/50">{verifyMessage}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-6">
          {verifyStatus === 'loading' && (
            <Loader2 className="w-16 h-16 animate-spin text-[#8B5A2B]" />
          )}
          {verifyStatus === 'success' && (
            <CheckCircle className="w-16 h-16 text-emerald-400" />
          )}
          {verifyStatus === 'error' && (
            <XCircle className="w-16 h-16 text-red-400" />
          )}
        </div>
        {verifyStatus !== 'loading' && (
          <Button onClick={() => setShowVerifyDialog(false)} className="w-full bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] hover:shadow-lg hover:shadow-[#8B5A2B]/30">
            Close
          </Button>
        )}
      </DialogContent>
    </Dialog>
    </main>
  );
}
