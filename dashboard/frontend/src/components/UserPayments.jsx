import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { 
  CreditCard, Plus, History, 
  AlertCircle, CheckCircle2, Clock,
  DollarSign, Calendar, Wallet
} from 'lucide-react';
import axios from 'axios';

const UserPayments = () => {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupModal, setTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const [paymentsRes, transactionsRes] = await Promise.all([
        axios.get('/user/payment-history'),
        axios.get('/user/transactions')
      ]);
      
      setPayments(paymentsRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      toast.error('Failed to load payment data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);
    
    if (amount < 10) {
      toast.error('Minimum top-up amount is 10 AED');
      return;
    }
    
    if (amount > 1000) {
      toast.error('Maximum top-up amount is 1000 AED');
      return;
    }

    setProcessing(true);
    try {
      await axios.post('/user/topup-credits', {
        amount: amount,
        payment_method: 'card'
      });
      
      toast.success(`Successfully added ${amount} AED to your account`);
      setTopupModal(false);
      setTopupAmount('');
      fetchPaymentData();
      // Refresh user data to show new balance
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Top-up failed');
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentStatusBadge = (status) => {
    const variants = {
      paid: 'bg-green-600',
      pending: 'bg-yellow-600',
      overdue: 'bg-red-600',
      cancelled: 'bg-gray-600'
    };
    return (
      <Badge className={`${variants[status]} text-white`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilBilling = () => {
    if (!user?.next_billing_date) return 0;
    const today = new Date();
    const billingDate = new Date(user.next_billing_date);
    const diffTime = billingDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysUntilBilling = getDaysUntilBilling();
  const isPaymentDue = daysUntilBilling <= 3;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white">Loading payment information...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Payments</h1>
        <p className="text-gray-400">Manage your credits, billing, and payment history</p>
      </div>

      {/* Payment Due Alert */}
      {isPaymentDue && (
        <Card className="bg-red-900/20 border-red-800">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">Payment Due Soon</p>
              <p className="text-red-300 text-sm">
                Your monthly bill of {user?.monthly_plan_cost} AED is due in {daysUntilBilling} days
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {user?.credits_balance?.toFixed(2) || '0.00'} AED
            </div>
            <p className="text-xs text-gray-400">Available credits</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Monthly Plan</CardTitle>
            <DollarSign className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {user?.monthly_plan_cost?.toFixed(0) || '0'} AED
            </div>
            <p className="text-xs text-gray-400">Per month</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Next Billing</CardTitle>
            <Calendar className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white">
              {daysUntilBilling} days
            </div>
            <p className="text-xs text-gray-400">
              {formatDate(user?.next_billing_date)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top-up Credits */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#00FFD1]" />
            Top-up Credits
          </CardTitle>
          <p className="text-gray-400">Add credits to your account (1 credit = 1 AED)</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label className="text-gray-300">Quick amounts</Label>
              <div className="flex gap-2 mt-2">
                {[50, 100, 200, 500].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => {
                      setTopupAmount(amount.toString());
                      setTopupModal(true);
                    }}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    {amount} AED
                  </Button>
                ))}
              </div>
            </div>
            
            <Dialog open={topupModal} onOpenChange={setTopupModal}>
              <DialogTrigger asChild>
                <Button className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Custom Amount
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Top-up Credits</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTopup} className="space-y-4">
                  <div>
                    <Label htmlFor="amount" className="text-gray-300">Amount (AED)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="10"
                      max="1000"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter amount (10 - 1000 AED)"
                      required
                    />
                  </div>
                  
                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                    <p className="text-blue-300 text-sm">
                      <strong>Note:</strong> This is a demo environment. No actual payment will be processed.
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      disabled={processing}
                      className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
                    >
                      {processing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : (
                        `Add ${topupAmount || '0'} AED`
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setTopupModal(false)}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <History className="h-5 w-5 text-[#00FFD1]" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-900/50 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{payment.description || 'Payment'}</p>
                      <p className="text-gray-400 text-sm">{formatDate(payment.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-white font-medium">{payment.amount} AED</p>
                    {getPaymentStatusBadge(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No payment history yet</p>
              <p className="text-sm">Your payment transactions will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Credit Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.amount > 0 ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <p className="text-white font-medium">{transaction.description}</p>
                      <p className="text-gray-400 text-sm">{formatDate(transaction.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} AED
                    </p>
                    <p className="text-gray-400 text-sm">
                      Balance: {transaction.credits_after} AED
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Your credit transactions will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPayments;