import React, { useState } from 'react';
import { X, MessageSquare, CheckCircle, Clock, Building2 } from 'lucide-react';

export default function CampaignTracker() {
  const [showProgress, setShowProgress] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className={`flex gap-4 transition-all ${showProgress ? '' : 'justify-center'}`}>
          {/* Campaign Card */}
          <div className={`bg-white rounded-lg shadow-lg p-6 ${showProgress ? 'w-1/2' : 'w-full max-w-2xl'} transition-all`}>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Campaign</h1>
              <button className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Promise Recorded <span className="font-semibold">Feb 15, 2025</span>
              </p>
              <p className="text-lg text-gray-800 mb-4">
                "The Metro line between KR Puram and Whitefield will be fully operational within 5 months." — <span className="font-semibold">Karnataka Congress Govt</span>
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Campaign Centered on</p>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Will the KR Puram–Whitefield Metro be completed within 5 months?
              </h2>
              <p className="text-sm text-gray-600 mb-4">Vote below</p>
            </div>

            {/* Voting Section */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button className="bg-blue-500 text-white rounded-lg p-4 text-left hover:bg-blue-600 transition">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="font-semibold">Confident</span>
                </div>
                <div className="text-2xl font-bold">62%</div>
              </button>

              <button className="bg-gray-100 text-gray-800 rounded-lg p-4 text-left hover:bg-gray-200 transition">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="font-semibold">Not sure</span>
                </div>
                <div className="text-2xl font-bold">23%</div>
              </button>

              <button className="bg-gray-100 text-gray-800 rounded-lg p-4 text-left hover:bg-gray-200 transition">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="font-semibold">Not confident</span>
                </div>
                <div className="text-2xl font-bold">15%</div>
              </button>
            </div>

            {/* Verification Badge */}
            <div className="flex items-center gap-2 mb-6 text-blue-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">Verified by CiviCast Mods</span>
            </div>

            {/* Progress Button */}
            <button 
              onClick={() => setShowProgress(!showProgress)}
              className={`w-full ${showProgress ? 'bg-gray-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white rounded-lg p-4 font-semibold hover:opacity-90 transition flex items-center justify-center gap-2`}
            >
              {showProgress ? (
                <>
                  <X className="w-5 h-5" />
                  Close Progress Updates
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  View Progress Updates & Community Reports
                </>
              )}
            </button>
          </div>

          {/* Progress Panel */}
          {showProgress && (
            <div className="bg-white rounded-lg shadow-lg p-6 w-1/2 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Progress Updates</h2>
              </div>

              {/* User Update Form */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Share Your Update</h3>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's the current status? Share your observations..."
                  rows="3"
                ></textarea>
                <button className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition">
                  Submit Update
                </button>
              </div>

              {/* Mid-term Verification */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Mid-term Verification</h3>
                    <p className="text-sm text-gray-600">May 2025</p>
                  </div>
                </div>
                <p className="text-gray-800 mb-3">
                  Visited the site. 70% of track work completed. Electrical fitment pending.
                </p>
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Verified by CiviCast Mods</span>
                </div>
              </div>

              {/* Community Updates */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg">Community Reports</h3>

                {/* Update 1 - Most Recent */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-900">@namma_metrofan</span>
                        <span className="text-sm text-gray-500">Mar 18, 2025</span>
                      </div>
                      <p className="text-gray-700 mb-2">They started test runs near KR Puram bridge!</p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-sm text-yellow-800">
                        <span className="font-semibold">Under Review</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Update 2 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-900">@urbanwatcher</span>
                        <span className="text-sm text-gray-500">Mar 15, 2025</span>
                      </div>
                      <p className="text-gray-700 mb-2">Visited ITPL station today — looks only 40% done.</p>
                      <img 
                        src="https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&h=200&fit=crop" 
                        alt="Station construction"
                        className="w-full h-40 object-cover rounded-lg mb-2"
                      />
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified by Platform Mods (User Proof Verified)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Update 3 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-900">@Ananya_P</span>
                        <span className="text-sm text-gray-500">Feb 2025</span>
                      </div>
                      <p className="text-gray-700 mb-2">Still construction work near Hoodi Circle</p>
                      <img 
                        src="https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400&h=200&fit=crop" 
                        alt="Construction site"
                        className="w-full h-40 object-cover rounded-lg mb-2"
                      />
                      <div className="flex items-center gap-2 text-blue-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified by CiviCast Mods</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Government Reply */}
                <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Building2 className="w-10 h-10 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-blue-900">BMRCL Public Relations</span>
                        <span className="text-sm text-gray-500">Aug 5, 2025</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Department/Official Reply</p>
                      <p className="text-gray-800">
                        Metro work 90% completed. Trial run expected by September. Civil works and signalling systems on track.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Citizen Poll */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-400 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="font-semibold text-gray-900">Citizen Poll Update</span>
                        <span className="text-sm text-gray-500 ml-2">62 Responses</span>
                      </div>
                      <p className="text-gray-800 mb-3">
                        <span className="font-semibold">12% Confident</span> | 23% Not sure | <span className="font-semibold">60% Not confident</span>
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">Top Issues:</span> Land acquisition delays, tunnel pace, worker shortage
                      </p>
                      <div className="flex items-center gap-2 text-blue-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified by Platform Mods</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}