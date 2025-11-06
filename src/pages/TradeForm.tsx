import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createTrade, updateTrade, getTradeById } from '../utils/api';
import { ArrowLeft, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Type for form data - excludes calculated fields like system_quality_number
interface TradeFormData {
  asset: string;
  asset_type: 'FX' | 'Futures' | 'Metals' | 'Commodities';
  trade_type: 'Long' | 'Short';
  size: string;
  session: 'Asia' | 'London 1' | 'London 2' | 'London 3' | 'New York 1' | 'New York 2' | 'New York 3';
  duration: string;
  entry_price: string;
  exit_price: string;
  time: string;
  outcome: 'win' | 'loss' | 'break_even';
  pnl: string;
  entry_tag: string;
  emotion: string;
  analysis: string;
  execution: string;
  trade_management: string;
  risk_management: string;
  mindset: string;
  what_liked: string;
  what_didnt_like: string;
  comment: string;
}

export default function TradeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState<TradeFormData>({
    asset: '',
    asset_type: 'FX',
    trade_type: 'Long',
    size: '',
    session: 'London 1',
    duration: '',
    entry_price: '',
    exit_price: '',
    time: new Date().toISOString().slice(0, 16),
    outcome: 'win',
    pnl: '',
    entry_tag: '',
    emotion: 'Calm',
    analysis: '3',
    execution: '3',
    trade_management: '3',
    risk_management: '3',
    mindset: '3',
    what_liked: '',
    what_didnt_like: '',
    comment: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  // Load trade data for editing
  useEffect(() => {
    if (isEditing && id) {
      const loadTrade = async () => {
        try {
          setInitialLoading(true);
          const trade = await getTradeById(id);
          if (trade) {
            setFormData({
              asset: trade.asset || '',
              asset_type: trade.asset_type || 'FX',
              trade_type: (trade.trade_type as 'Long' | 'Short') || 'Long',
              size: trade.size?.toString() || '',
              session: trade.session || 'London 1',
              duration: trade.duration || '',
              entry_price: trade.entry_price?.toString() || '',
              exit_price: trade.exit_price?.toString() || '',
              time: trade.time ? new Date(trade.time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
              outcome: trade.outcome || 'win',
              pnl: trade.pnl?.toString() || '',
              entry_tag: trade.entry_tag || '',
              emotion: trade.emotion || 'Calm',
              analysis: trade.analysis?.toString() || '3', // Default for older trades
              execution: trade.execution?.toString() || '3', // Default for older trades
              trade_management: trade.trade_management?.toString() || '3', // Default for older trades
              risk_management: trade.risk_management?.toString() || '3', // Default for older trades
              mindset: trade.mindset?.toString() || '3', // Default for older trades
              what_liked: trade.what_liked || '',
              what_didnt_like: trade.what_didnt_like || '',
              comment: trade.comment || '',
            });
          }
        } catch (error) {
          console.error('Error loading trade:', error);
          alert('Failed to load trade data');
        } finally {
          setInitialLoading(false);
        }
      };
      loadTrade();
    }
  }, [isEditing, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const tradeData = {
        ...formData,
        user_id: user.id,
        size: parseFloat(formData.size),
        entry_price: parseFloat(formData.entry_price),
        exit_price: parseFloat(formData.exit_price),
        pnl: parseFloat(formData.pnl),
        // Parse scoring fields as integers and include them in tradeData
        analysis: parseInt(formData.analysis) || 3,
        execution: parseInt(formData.execution) || 3,
        trade_management: parseInt(formData.trade_management) || 3,
        risk_management: parseInt(formData.risk_management) || 3,
        mindset: parseInt(formData.mindset) || 3,
        // Note: system_quality_number is excluded from submission as it's auto-calculated
      };

      if (isEditing) {
        await updateTrade(id, tradeData);
      } else {
        await createTrade(tradeData);
      }

      navigate('/trades');
    } catch (error) {
      console.error('Error saving trade:', error);
      alert('Failed to save trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/trades')}
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Trade' : 'New Trade'}
        </h1>
      </div>

      {/* Form */}
      {initialLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading trade data...</div>
          </div>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 space-y-6">
        {/* Basic Trade Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="asset">Asset</Label>
            <Input
              id="asset"
              type="text"
              name="asset"
              value={formData.asset}
              onChange={handleChange}
              required
              placeholder="e.g., BTC/USD, AAPL"
            />
          </div>

          <div>
            <Label htmlFor="trade_type">Trade Type</Label>
            <select
              id="trade_type"
              name="trade_type"
              value={formData.trade_type}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Asset Type
            </label>
            <select
              name="asset_type"
              value={formData.asset_type}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
            >
              <option value="FX">FX</option>
              <option value="Futures">Futures</option>
              <option value="Metals">Metals</option>
              <option value="Commodities">Commodities</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session
            </label>
            <select
              name="session"
              value={formData.session}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
            >
              <option value="Asia">Asia</option>
              <option value="London 1">London 1</option>
              <option value="London 2">London 2</option>
              <option value="London 3">London 3</option>
              <option value="New York 1">New York 1</option>
              <option value="New York 2">New York 2</option>
              <option value="New York 3">New York 3</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 2h 30m"
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <Label htmlFor="size">Size</Label>
            <Input
              id="size"
              type="number"
              name="size"
              value={formData.size}
              onChange={handleChange}
              required
              step="0.01"
              placeholder="Position size"
            />
          </div>

          <div>
            <Label htmlFor="entry_price">Entry Price</Label>
            <Input
              id="entry_price"
              type="number"
              name="entry_price"
              value={formData.entry_price}
              onChange={handleChange}
              required
              step="0.01"
              placeholder="Entry price"
            />
          </div>

          <div>
            <Label htmlFor="exit_price">Exit Price</Label>
            <Input
              id="exit_price"
              type="number"
              name="exit_price"
              value={formData.exit_price}
              onChange={handleChange}
              required
              step="0.01"
              placeholder="Exit price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time
            </label>
            <input
              type="datetime-local"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Outcome
            </label>
            <select
              name="outcome"
              value={formData.outcome}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
            >
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="break_even">Break Even</option>
            </select>
          </div>

          <div>
            <Label htmlFor="pnl">P&L</Label>
            <Input
              id="pnl"
              type="number"
              name="pnl"
              value={formData.pnl}
              onChange={handleChange}
              required
              step="0.01"
              placeholder="Profit/Loss amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entry Tag
            </label>
            <input
              type="text"
              name="entry_tag"
              value={formData.entry_tag}
              onChange={handleChange}
              placeholder="e.g., Breakout, Reversal"
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
            />
          </div>



          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emotion
            </label>
            <select
              name="emotion"
              value={formData.emotion}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
            >
              <option value="Calm">Calm</option>
              <option value="Anxious">Anxious</option>
              <option value="Excited">Excited</option>
              <option value="Confident">Confident</option>
              <option value="Fearful">Fearful</option>
            </select>
          </div>
        </div>

        {/* Performance Scores */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Performance Scores (1-5)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Analysis
              </label>
              <select
                name="analysis"
                value={formData.analysis}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
              >
                <option value="1">1 - Poor analysis, lacked key market insights</option>
                <option value="2">2 - Below average analysis, missed important factors</option>
                <option value="3">3 - Adequate analysis, covered basic requirements</option>
                <option value="4">4 - Good analysis, identified most key factors</option>
                <option value="5">5 - Excellent analysis, comprehensive market understanding</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Execution
              </label>
              <select
                name="execution"
                value={formData.execution}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
              >
                <option value="1">1 - Poor execution, multiple errors or delays</option>
                <option value="2">2 - Below average execution, some inefficiencies</option>
                <option value="3">3 - Adequate execution, minor issues</option>
                <option value="4">4 - Good execution, smooth and professional</option>
                <option value="5">5 - Excellent execution, flawless and timely</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trade Management
              </label>
              <select
                name="trade_management"
                value={formData.trade_management}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
              >
                <option value="1">1 - Poor management, no clear plan or adjustments</option>
                <option value="2">2 - Below average management, reactive approach</option>
                <option value="3">3 - Adequate management, basic trade supervision</option>
                <option value="4">4 - Good management, proactive adjustments as needed</option>
                <option value="5">5 - Excellent management, optimal throughout duration</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Risk Management
              </label>
              <select
                name="risk_management"
                value={formData.risk_management}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
              >
                <option value="1">1 - Poor risk management, high exposure without proper controls</option>
                <option value="2">2 - Below average risk management, insufficient safeguards</option>
                <option value="3">3 - Adequate risk management, basic protection measures</option>
                <option value="4">4 - Good risk management, proper position sizing and stops</option>
                <option value="5">5 - Excellent risk management, optimal risk-reward balance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mindset
              </label>
              <select
                name="mindset"
                value={formData.mindset}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
              >
                <option value="1">1 - Poor emotional control, fear or greed dominated</option>
                <option value="2">2 - Below average mindset, emotional interference</option>
                <option value="3">3 - Adequate mindset, generally disciplined approach</option>
                <option value="4">4 - Good mindset, strong emotional discipline</option>
                <option value="5">5 - Excellent mindset, perfect emotional control and focus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trade Notes */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What You Liked
            </label>
            <textarea
              name="what_liked"
              value={formData.what_liked}
              onChange={handleChange}
              rows={3}
              placeholder="What went well with this trade?"
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What You Didn't Like
            </label>
            <textarea
              name="what_didnt_like"
              value={formData.what_didnt_like}
              onChange={handleChange}
              rows={3}
              placeholder="What could have been better?"
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Comments
            </label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows={4}
              placeholder="Any additional notes about this trade..."
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/trades')}
            className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Saving...' : 'Save Trade'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
