import React, { useState } from 'react';
import { Upload, Download, Loader2, Sparkles, Crown, X, Check } from 'lucide-react';

export default function AIImageCompressor() {
  const [image, setImage] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [quality, setQuality] = useState(80);
  const [userTier, setUserTier] = useState('free'); // 'free', 'pro', 'premium'
  const [showPricing, setShowPricing] = useState(false);

  const tiers = {
    free: { maxSize: 5, name: 'Free', price: 0 },
    pro: { maxSize: 50, name: 'Pro', price: 9.99 },
    premium: { maxSize: Infinity, name: 'Premium', price: 19.99 }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const fileSizeMB = file.size / (1024 * 1024);
      const maxSize = tiers[userTier].maxSize;

      if (fileSizeMB > maxSize) {
        alert(`Your current plan (${tiers[userTier].name}) allows images up to ${maxSize}MB. This image is ${fileSizeMB.toFixed(2)}MB. Please upgrade to compress larger images.`);
        setShowPricing(true);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImage({
          data: event.target.result,
          name: file.name,
          size: file.size
        });
        setCompressedImage(null);
        setStats(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpgrade = (tier) => {
    // In production, integrate with Stripe, PayPal, or another payment processor
    if (tier === 'free') {
      setUserTier('free');
      setShowPricing(false);
      alert('Switched to Free tier');
    } else {
      // Simulate payment processing
      const confirmed = confirm(`Upgrade to ${tiers[tier].name} for $${tiers[tier].price}/month?`);
      if (confirmed) {
        // Here you would integrate with a real payment gateway
        // For demo purposes, we'll just upgrade the user
        setUserTier(tier);
        setShowPricing(false);
        alert(`Successfully upgraded to ${tiers[tier].name}! (Demo mode - no actual payment processed)`);
      }
    }
  };

  const compressImage = async () => {
    if (!image) return;
    
    setLoading(true);
    try {
      const base64Data = image.data.split(',')[1];
      const mimeType = image.data.split(';')[0].split(':')[1];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: `Analyze this image for compression. Respond ONLY with a JSON object (no markdown, no explanation):
{
  "recommendation": "quality level 1-100",
  "imageType": "photo/graphic/screenshot/etc",
  "complexity": "low/medium/high",
  "suggestion": "brief compression tip"
}`
              }
            ]
          }],
        })
      });

      const data = await response.json();
      const aiResponse = data.content[0].text.trim();
      const cleanJson = aiResponse.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(cleanJson);

      const targetQuality = quality / 100;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const compressed = e.target.result;
              setCompressedImage(compressed);
              
              setStats({
                original: (image.size / 1024).toFixed(2),
                compressed: (blob.size / 1024).toFixed(2),
                savings: (((image.size - blob.size) / image.size) * 100).toFixed(1),
                analysis: analysis
              });
              setLoading(false);
            };
            reader.readAsDataURL(blob);
          },
          mimeType,
          targetQuality
        );
      };
      img.src = image.data;

    } catch (error) {
      console.error('Compression error:', error);
      setLoading(false);
      alert('Compression failed. Please try again.');
    }
  };

  const downloadImage = () => {
    if (!compressedImage) return;
    
    const link = document.createElement('a');
    link.href = compressedImage;
    
    const ext = image.name.split('.').pop();
    link.download = `compressed_${Date.now()}.${ext}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-yellow-400" />
            <h1 className="text-5xl font-bold text-white">Pixilo</h1>
          </div>
          <p className="text-xl text-blue-200">Intelligent compression powered by Claude AI - 100% free</p>
          <p className="text-lg text-blue-300 mt-2">A project by Nebula Neural</p>
        </div>

        {/* Current Plan Badge */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-full px-6 py-3 border border-white/20 flex items-center gap-3">
            {userTier !== 'free' && <Crown className="w-5 h-5 text-yellow-400" />}
            <span className="text-white font-semibold">Current Plan: {tiers[userTier].name}</span>
            <span className="text-blue-200">• Max {tiers[userTier].maxSize === Infinity ? 'Unlimited' : `${tiers[userTier].maxSize}MB`}</span>
            <button 
              onClick={() => setShowPricing(true)}
              className="ml-2 text-yellow-400 hover:text-yellow-300 underline"
            >
              {userTier === 'free' ? 'Upgrade' : 'Manage'}
            </button>
          </div>
        </div>

        {/* Pricing Modal */}
        {showPricing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-8 max-w-4xl w-full border border-white/20 relative">
              <button 
                onClick={() => setShowPricing(false)}
                className="absolute top-4 right-4 text-white hover:text-blue-200"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-3xl font-bold text-white text-center mb-8">Choose Your Plan</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free Tier */}
                <div className={`bg-white/5 rounded-xl p-6 border ${userTier === 'free' ? 'border-blue-400' : 'border-white/20'}`}>
                  <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                  <p className="text-4xl font-bold text-white mb-4">$0<span className="text-lg text-blue-200">/mo</span></p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-blue-200">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Up to 5MB images</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-200">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>AI-powered compression</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-200">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Unlimited compressions</span>
                    </li>
                  </ul>
                  {userTier === 'free' ? (
                    <button className="w-full bg-blue-500/50 text-white py-3 rounded-lg font-semibold" disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpgrade('free')}
                      className="w-full bg-white/10 text-white py-3 rounded-lg font-semibold hover:bg-white/20 transition-all"
                    >
                      Downgrade
                    </button>
                  )}
                </div>

                {/* Pro Tier */}
                <div className={`bg-white/5 rounded-xl p-6 border-2 ${userTier === 'pro' ? 'border-yellow-400' : 'border-yellow-400/50'} relative`}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-sm font-bold">
                    POPULAR
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    Pro <Crown className="w-5 h-5 text-yellow-400" />
                  </h3>
                  <p className="text-4xl font-bold text-white mb-4">$9.99<span className="text-lg text-blue-200">/mo</span></p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-blue-200">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Up to 50MB images</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-200">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Priority AI processing</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-200">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Batch compression</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-200">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>No watermarks</span>
                    </li>
                  </ul>
                  {userTier === 'pro' ? (
                    <button className="w-full bg-yellow-400 text-purple-900 py-3 rounded-lg font-semibold" disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpgrade('pro')}
                      className="w-full bg-yellow-400 text-purple-900 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-all"
                    >
                      Upgrade to Pro
                    </button>
                  )}
                </div>

                {/* Premium Tier */}
                <div className={`bg-white/5 rounded-xl p-6 border ${userTier === 'premium' ? 'border-purple-400' : 'border-white/20'}`}>
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    Premium <Crown className="w-5 h-5 text-purple-400" />
                  </h3>
                  <p className="text-4xl font-bold text-white mb-4">$19.99<span className="text-lg text-blue-200">/mo</span></p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-blue-200">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Unlimited image size</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-200">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Advanced AI features</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-200">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>API access</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-200">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                  {userTier === 'premium' ? (
                    <button className="w-full bg-purple-500/50 text-white py-3 rounded-lg font-semibold" disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpgrade('premium')}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      Upgrade to Premium
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col items-center">
            <label className="w-full cursor-pointer">
              <div className="border-4 border-dashed border-blue-300 rounded-xl p-12 text-center hover:border-blue-400 transition-all hover:bg-white/5">
                <Upload className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                <p className="text-xl text-white mb-2">Drop your image here or click to browse</p>
                <p className="text-blue-200">Supports JPG, PNG, WebP • Max {tiers[userTier].maxSize === Infinity ? 'Unlimited' : `${tiers[userTier].maxSize}MB`}</p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {image && (
              <div className="mt-8 w-full">
                <div className="mb-6">
                  <label className="block text-white mb-2 text-lg">Compression Quality: {quality}%</label>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full h-2 bg-blue-300 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-blue-200 mt-1">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>

                <button
                  onClick={compressImage}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      AI is analyzing and compressing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Compress with AI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {stats && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              AI Analysis & Results
            </h2>

            {/* AI Insights */}
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-6 mb-6 border border-purple-300/30">
              <h3 className="text-lg font-semibold text-white mb-3">AI Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                <div>
                  <p className="text-blue-200 text-sm">Image Type</p>
                  <p className="font-semibold capitalize">{stats.analysis.imageType}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Complexity</p>
                  <p className="font-semibold capitalize">{stats.analysis.complexity}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">AI Recommendation</p>
                  <p className="font-semibold">{stats.analysis.recommendation}</p>
                </div>
              </div>
              <p className="text-blue-100 mt-4 italic">💡 {stats.analysis.suggestion}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <p className="text-blue-200 mb-2">Original Size</p>
                <p className="text-3xl font-bold text-white">{stats.original} KB</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <p className="text-blue-200 mb-2">Compressed Size</p>
                <p className="text-3xl font-bold text-white">{stats.compressed} KB</p>
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-300/30">
                <p className="text-green-200 mb-2">Space Saved</p>
                <p className="text-3xl font-bold text-white">{stats.savings}%</p>
              </div>
            </div>

            {/* Image Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-white font-semibold mb-3">Original</h3>
                <img src={image.data} alt="Original" className="w-full rounded-lg border-2 border-white/20" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Compressed</h3>
                <img src={compressedImage} alt="Compressed" className="w-full rounded-lg border-2 border-green-400/50" />
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadImage}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-6 h-6" />
              Download Compressed Image
            </button>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-xl font-bold text-white mb-2">AI-Powered</h3>
            <p className="text-blue-200">Claude AI analyzes your image for optimal compression</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <svg className="w-12 h-12 mx-auto mb-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">Quality Preserved</h3>
            <p className="text-blue-200">Smart compression maintains visual quality</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <Download className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-bold text-white mb-2">Flexible Plans</h3>
            <p className="text-blue-200">Free tier available, upgrade for larger images</p>
          </div>
        </div>
      </div>
    </div>
  );
}