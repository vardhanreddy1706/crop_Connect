import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, Send, Sprout } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/auth/forgot-password', { email });

      toast.success(data.message);
      setEmailSent(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/login.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Link
        to="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-green-800 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Login</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-green-100">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <Sprout className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
            <p className="text-gray-600">
              {emailSent
                ? "Check your email for reset instructions"
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-semibold ${
                  loading
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                } transition-all shadow-lg hover:shadow-xl`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <p className="text-green-800 mb-4">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-green-700">
                Please check your inbox and spam folder. The link will expire in 1 hour.
              </p>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="mt-4 text-green-600 hover:text-green-700 font-semibold text-sm"
              >
                Try a different email
              </button>
            </div>
          )}

          {/* Back to Login */}
          <div className="text-center">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help?{' '}
          <a href="mailto:support@cropconnect.com" className="text-green-600 hover:text-green-700 font-medium">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;