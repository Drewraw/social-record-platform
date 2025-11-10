import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, TrendingUp, Shield, DollarSign, Users } from 'lucide-react';

const QAChat = () => {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: "👋 Hi! I'm your Political Data Assistant. Ask me anything about Karnataka's politicians!\n\nTry questions like:\n• Who is the richest MLA?\n• Who has the most criminal cases?\n• Compare assets of PC Mohan vs Shobha Karandlaje\n• Tell me about D.K. Shivakumar's wealth",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // ...existing code...

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call RAG API
      const response = await fetch('http://localhost:5001/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          officialName: null // Let RAG search across all officials
        }),
      });

      const data = await response.json();

      const assistantMessage = {
        type: 'assistant',
        content: data.answer || "I couldn't find relevant information. Please try rephrasing your question.",
        sources: data.sources || [],
        confidence: data.confidence || 'low',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error querying RAG:', error);
      
      const errorMessage = {
        type: 'assistant',
        content: "⚠️ Sorry, I encountered an error. Please make sure the backend server is running and try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInputValue(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '2rem auto',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      height: '80vh',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles size={24} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Ask Political Data AI
            </h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0.25rem 0 0 0' }}>
              Powered by RAG (Retrieval-Augmented Generation) + Gemini
            </p>
          </div>
        </div>
      </div>

      {/* ...existing code... */}

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        background: '#f9fafb'
      }}>
        {messages.map((message, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '1rem 1.25rem',
              borderRadius: message.type === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
              background: message.type === 'user' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'white',
              color: message.type === 'user' ? 'white' : '#1f2937',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {message.type === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={16} color="#667eea" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#667eea' }}>
                    AI Assistant
                  </span>
                  {message.confidence && (
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      background: message.confidence === 'high' ? '#d1fae5' : 
                                 message.confidence === 'medium' ? '#fef3c7' : '#fee2e2',
                      color: message.confidence === 'high' ? '#065f46' : 
                             message.confidence === 'medium' ? '#78350f' : '#991b1b',
                      fontWeight: 600
                    }}>
                      {message.confidence === 'high' ? '✓ High Confidence' : 
                       message.confidence === 'medium' ? '~ Medium' : '⚠ Low'}
                    </span>
                  )}
                </div>
              )}
              
              <div style={{ fontSize: '0.9375rem', lineHeight: '1.6' }}>
                {message.content}
              </div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>
                    📚 Sources:
                  </p>
                  {message.sources.map((source, sidx) => (
                    <div key={sidx} style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'start',
                      gap: '0.5rem'
                    }}>
                      <span>•</span>
                      <span>
                        {source.content}
                        {source.verified && (
                          <span style={{ color: '#10b981', marginLeft: '0.25rem' }}>✓</span>
                        )}
                        <span style={{ fontStyle: 'italic', color: '#9ca3af', marginLeft: '0.25rem' }}>
                          ({source.source})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                fontSize: '0.65rem',
                color: message.type === 'user' ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                marginTop: '0.5rem'
              }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <span>AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '1.25rem',
        borderTop: '1px solid #e5e7eb',
        background: 'white'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'end'
        }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about politicians' assets, criminal cases, education..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '0.9375rem',
              resize: 'none',
              minHeight: '48px',
              maxHeight: '120px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '0.875rem 1.5rem',
              background: inputValue.trim() && !isLoading 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#e5e7eb',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              minWidth: '100px',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send
              </>
            )}
          </button>
        </div>
        
        <p style={{ 
          fontSize: '0.75rem', 
          color: '#9ca3af', 
          marginTop: '0.75rem',
          textAlign: 'center'
        }}>
          💡 Data sources: MyNeta.info verified affidavits • Election Commission of India
        </p>
      </div>

      {/* CSS for animations */}
      <style>{`
        .loading-dots {
          display: flex;
          gap: 0.25rem;
        }
        
        .dot {
          width: 6px;
          height: 6px;
          background: #6b7280;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default QAChat;

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, TrendingUp, Shield, DollarSign, Users } from 'lucide-react';
import { ragAPI } from '../services/api';

const QAChat = () => {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: "👋 Hi! I'm your Political Data Assistant. Ask me anything about Karnataka's politicians!\n\nTry questions like:\n• Who is the richest MLA?\n• Who has the most criminal cases?\n• Compare assets of PC Mohan vs Shobha Karandlaje\n• Tell me about D.K. Shivakumar's wealth",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // ...existing code...

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call RAG API using centralized service
      const response = await ragAPI.query(userMessage.content);
      const data = response.data;

      // Transform sources to match frontend expectations
      const transformedSources = (data.sources || []).map(source => ({
        content: `${source.politician} (${source.party}) - ${source.contentType}`,
        verified: true, // All RAG sources are from verified data
        source: `Similarity: ${source.similarity}`
      }));

      const assistantMessage = {
        type: 'assistant',
        content: data.data?.answer || data.answer || "I couldn't find relevant information. Please try rephrasing your question.",
        sources: transformedSources,
        confidence: data.confidence || 'medium', // Default to medium if not provided
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error querying RAG:', error);

      const errorMessage = {
        type: 'assistant',
        content: "⚠️ Sorry, I encountered an error. Please make sure the backend server is running and try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInputValue(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '2rem auto',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      height: '80vh',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles size={24} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Ask Political Data AI
            </h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0.25rem 0 0 0' }}>
              Powered by RAG (Retrieval-Augmented Generation) + Gemini
            </p>
          </div>
        </div>
      </div>

      {/* ...existing code... */}

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        background: '#f9fafb'
      }}>
        {messages.map((message, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '1rem 1.25rem',
              borderRadius: message.type === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
              background: message.type === 'user' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'white',
              color: message.type === 'user' ? 'white' : '#1f2937',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {message.type === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={16} color="#667eea" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#667eea' }}>
                    AI Assistant
                  </span>
                  {message.confidence && (
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      background: message.confidence === 'high' ? '#d1fae5' : 
                                 message.confidence === 'medium' ? '#fef3c7' : '#fee2e2',
                      color: message.confidence === 'high' ? '#065f46' : 
                             message.confidence === 'medium' ? '#78350f' : '#991b1b',
                      fontWeight: 600
                    }}>
                      {message.confidence === 'high' ? '✓ High Confidence' : 
                       message.confidence === 'medium' ? '~ Medium' : '⚠ Low'}
                    </span>
                  )}
                </div>
              )}
              
              <div style={{ fontSize: '0.9375rem', lineHeight: '1.6' }}>
                {message.content}
              </div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>
                    📚 Sources:
                  </p>
                  {message.sources.map((source, sidx) => (
                    <div key={sidx} style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'start',
                      gap: '0.5rem'
                    }}>
                      <span>•</span>
                      <span>
                        {source.content}
                        {source.verified && (
                          <span style={{ color: '#10b981', marginLeft: '0.25rem' }}>✓</span>
                        )}
                        <span style={{ fontStyle: 'italic', color: '#9ca3af', marginLeft: '0.25rem' }}>
                          ({source.source})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                fontSize: '0.65rem',
                color: message.type === 'user' ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                marginTop: '0.5rem'
              }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <span>AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '1.25rem',
        borderTop: '1px solid #e5e7eb',
        background: 'white'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'end'
        }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about politicians' assets, criminal cases, education..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '0.9375rem',
              resize: 'none',
              minHeight: '48px',
              maxHeight: '120px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '0.875rem 1.5rem',
              background: inputValue.trim() && !isLoading 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#e5e7eb',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              minWidth: '100px',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send
              </>
            )}
          </button>
        </div>
        
        <p style={{ 
          fontSize: '0.75rem', 
          color: '#9ca3af', 
          marginTop: '0.75rem',
          textAlign: 'center'
        }}>
          💡 Data sources: MyNeta.info verified affidavits • Election Commission of India
        </p>
      </div>

      {/* CSS for animations */}
      <style>{`
        .loading-dots {
          display: flex;
          gap: 0.25rem;
        }
        
        .dot {
          width: 6px;
          height: 6px;
          background: #6b7280;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default QAChat;
