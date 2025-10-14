import { useEffect, useState } from 'react';
import { useTawkTo } from '@quillsocial/lib/tawkto';
import type { TawkToVisitor } from '@quillsocial/lib/tawkto';

/**
 * Test page to verify Tawk.to integration
 * Visit this page at: http://localhost:3000/test/tawkto
 */
export default function TawkToTestPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [extractedVisitor, setExtractedVisitor] = useState<TawkToVisitor | null>(null);

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const {
    isLoaded,
    status,
    isChatOngoing,
    isVisible,
    visitorInfo,
    show,
    hide,
    maximize,
  } = useTawkTo({
    debug: true, // Enable debug logging
    onLoad: () => {
      addMessage('✅ Tawk.to widget loaded successfully');
    },
    onStatusChange: (newStatus) => {
      addMessage(`📡 Status changed to: ${newStatus}`);
    },
    onChatStarted: () => {
      addMessage('💬 Chat started');
    },
    onChatEnded: () => {
      addMessage('🔚 Chat ended');
    },
    onChatMessageVisitor: (message, visitor) => {
      addMessage(`👤 Visitor message: "${message}"`);
      if (visitor) {
        addMessage(`📧 Visitor info: ${JSON.stringify(visitor, null, 2)}`);
        setExtractedVisitor(visitor);
      }
    },
    onPrechatSubmit: (data) => {
      addMessage(`📝 Pre-chat form submitted: ${JSON.stringify(data, null, 2)}`);
      setExtractedVisitor({
        name: data.name || data.fullName,
        email: data.email,
        phone: data.phone,
        ...data
      });
    }
  });

  useEffect(() => {
    if (visitorInfo) {
      addMessage(`🔄 Visitor info updated: ${JSON.stringify(visitorInfo, null, 2)}`);
    }
  }, [visitorInfo]);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1>🧪 Tawk.to Integration Test Page</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginTop: '20px'
      }}>
        {/* Status Panel */}
        <div style={{
          border: '2px solid #ccc',
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: '#f9f9f9'
        }}>
          <h2>📊 Widget Status</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Loaded:</td>
                <td style={{ padding: '8px' }}>{isLoaded ? '✅ Yes' : '❌ No'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Status:</td>
                <td style={{ padding: '8px' }}>{status || '⏳ Loading...'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Chat Ongoing:</td>
                <td style={{ padding: '8px' }}>{isChatOngoing ? '✅ Yes' : '❌ No'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Visible:</td>
                <td style={{ padding: '8px' }}>{isVisible ? '✅ Yes' : '❌ No'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Visitor Info Panel */}
        <div style={{
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: '#f0fff0'
        }}>
          <h2>👤 Visitor Information</h2>
          {extractedVisitor || visitorInfo ? (
            <div>
              <pre style={{
                backgroundColor: '#e8f5e9',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto'
              }}>
                {JSON.stringify(extractedVisitor || visitorInfo, null, 2)}
              </pre>
            </div>
          ) : (
            <p style={{ color: '#666' }}>No visitor information captured yet.</p>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        border: '2px solid #2196F3',
        borderRadius: '8px',
        backgroundColor: '#e3f2fd'
      }}>
        <h2>🎮 Widget Controls</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={show}
            disabled={!isLoaded}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoaded ? 'pointer' : 'not-allowed',
              opacity: isLoaded ? 1 : 0.5
            }}
          >
            📂 Show Widget
          </button>
          <button
            onClick={hide}
            disabled={!isLoaded}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoaded ? 'pointer' : 'not-allowed',
              opacity: isLoaded ? 1 : 0.5
            }}
          >
            🚫 Hide Widget
          </button>
          <button
            onClick={maximize}
            disabled={!isLoaded}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoaded ? 'pointer' : 'not-allowed',
              opacity: isLoaded ? 1 : 0.5
            }}
          >
            ⬆️ Maximize Chat
          </button>
        </div>
      </div>

      {/* Event Log */}
      <div style={{
        marginTop: '20px',
        border: '2px solid #FF9800',
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: '#fff3e0'
      }}>
        <h2>📜 Event Log</h2>
        <div style={{
          maxHeight: '300px',
          overflow: 'auto',
          backgroundColor: '#fafafa',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {messages.length === 0 ? (
            <p style={{ color: '#666' }}>Waiting for events...</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} style={{
                padding: '4px 0',
                borderBottom: '1px solid #eee',
                whiteSpace: 'pre-wrap'
              }}>
                {msg}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        border: '2px solid #9C27B0',
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: '#f3e5f5'
      }}>
        <h2>📋 Testing Instructions</h2>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Open the Tawk.to chat widget (bottom-right corner)</li>
          <li>If you see a pre-chat form, fill it out with:
            <ul>
              <li>Name: Test User</li>
              <li>Email: test@example.com</li>
            </ul>
          </li>
          <li>Send a test message</li>
          <li>Watch the "Visitor Information" panel above for captured data</li>
          <li>Check the "Event Log" for detailed activity</li>
          <li>Also check browser console for debug logs</li>
        </ol>

        <h3 style={{ marginTop: '15px' }}>🔧 If visitor info is not showing:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Go to <a href="https://dashboard.tawk.to/" target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3' }}>Tawk.to Dashboard</a></li>
          <li>Navigate to: Administration → Chat Widget → Pre-Chat Form</li>
          <li>Enable the pre-chat form</li>
          <li>Set Name and Email as required fields</li>
          <li>Save and reload this page</li>
        </ol>
      </div>

      {/* Configuration Info */}
      <div style={{
        marginTop: '20px',
        border: '2px solid #607D8B',
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: '#eceff1'
      }}>
        <h2>⚙️ Current Configuration</h2>
        <pre style={{
          backgroundColor: '#fff',
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
{`Property ID: ${process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_ID || 'Not set'}
Widget ID: ${process.env.NEXT_PUBLIC_TAWK_TO_WIDGET_ID || 'Not set'}
Environment: ${process.env.NODE_ENV}
Debug Mode: Enabled`}
        </pre>
      </div>
    </div>
  );
}
