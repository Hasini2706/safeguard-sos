import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://yrhhehjiibbekgzbmupz.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyaGhlaGppaWJiZWtnemJtdXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5NjM3NjYsImV4cCI6MTc2MjQ5OTc2Nn0.xYz_placeholder'
);

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: 'Mom', phone: '+91' },
    { id: 2, name: 'Dad', phone: '+91' },
    { id: 3, name: 'Police', phone: '100' }
  ]);
  const [userPhone, setUserPhone] = useState('+91');
  const [statusMessage, setStatusMessage] = useState('Ready to monitor');
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const streamRef = useRef(null);

  // Start audio monitoring
  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyzerNode = audioContext.createAnalyser();
      analyzerRef.current = analyzerNode;
      analyzerNode.fftSize = 256;
      
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyzerNode);
      
      setIsListening(true);
      setStatusMessage('🎤 Audio monitoring active');
      monitorAudio();
    } catch (error) {
      setStatusMessage('❌ Microphone access denied');
    }
  };

  // Monitor audio levels
  const monitorAudio = () => {
    if (!analyzerRef.current) return;
    
    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average);
    
    // Trigger alert if loud sound detected (threshold: 30 after normalization)
    if (average > 30 && !alertTriggered) {
      triggerEmergencyAlert();
    }
    
    if (isListening) {
      requestAnimationFrame(monitorAudio);
    }
  };

  // Stop audio monitoring
  const stopAudioMonitoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
    setAudioLevel(0);
    setStatusMessage('Monitoring stopped');
  };

  // Trigger emergency alert
  const triggerEmergencyAlert = async () => {
    setAlertTriggered(true);
    setStatusMessage('🚨 EMERGENCY ALERT TRIGGERED!');
    
    // Send SMS to all emergency contacts
    for (const contact of emergencyContacts) {
      await sendSMS(contact.phone, `URGENT: ${contact.name}, Help needed! Location: Check your contact's location.`);
    }
    
    // Play alert sound
    playAlertSound();
    
    // Reset after 5 seconds
    setTimeout(() => {
      setAlertTriggered(false);
      setStatusMessage('Alert sent! System ready.');
    }, 5000);
  };

  // Manual SOS button press
  const handleManualSOS = async () => {
    setAlertTriggered(true);
    setStatusMessage('🚨 MANUAL SOS ACTIVATED!');
    
    for (const contact of emergencyContacts) {
      await sendSMS(contact.phone, `EMERGENCY: Manual SOS activated! Need immediate help.`);
    }
    
    playAlertSound();
    
    setTimeout(() => {
      setAlertTriggered(false);
      setStatusMessage('Alert sent! Waiting for response.');
    }, 5000);
  };

  // Send SMS via Supabase Edge Function
  const sendSMS = async (phoneNumber, message) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phone: phoneNumber,
          message: message,
          apiKey: import.meta.env.VITE_FAST2SMS_API_KEY || 'placeholder'
        }
      });
      
      if (error) console.error('SMS Error:', error);
      console.log('SMS sent to', phoneNumber);
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  };

  // Play alert sound
  const playAlertSound = () => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1000; // 1kHz tone
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        padding: '40px',
        textAlign: 'center'
      }}>
        {/* Header */}
        <h1 style={{ color: '#2d3748', marginBottom: '10px', fontSize: '32px' }}>
          🛡️ SafeGuard SOS
        </h1>
        <p style={{ color: '#718096', marginBottom: '30px', fontSize: '16px' }}>
          Personal Safety System with Audio Detection
        </p>

        {/* Status */}
        <div style={{
          backgroundColor: alertTriggered ? '#fed7d7' : '#c6f6d5',
          color: alertTriggered ? '#c53030' : '#22543d',
          padding: '15px 20px',
          borderRadius: '10px',
          marginBottom: '30px',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          {statusMessage}
        </div>

        {/* Audio Level Visualizer */}
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f7fafc',
          borderRadius: '10px'
        }}>
          <p style={{ color: '#4a5568', marginBottom: '10px', fontSize: '14px' }}>
            Sound Level: {Math.round(audioLevel)}/255
          </p>
          <div style={{
            width: '100%',
            height: '30px',
            backgroundColor: '#e2e8f0',
            borderRadius: '15px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(audioLevel / 255) * 100}%`,
              height: '100%',
              background: audioLevel > 30 ? '#f56565' : '#48bb78',
              transition: 'width 0.1s ease',
              borderRadius: '15px'
            }}></div>
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexDirection: 'column' }}>
          <button
            onClick={isListening ? stopAudioMonitoring : startAudioMonitoring}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              backgroundColor: isListening ? '#f56565' : '#48bb78',
              color: 'white',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            {isListening ? '⏹️ Stop Monitoring' : '🎤 Start Monitoring'}
          </button>
        </div>

        {/* Manual SOS Button */}
        <button
          onClick={handleManualSOS}
          style={{
            width: '100%',
            padding: '20px',
            fontSize: '24px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '15px',
            backgroundColor: '#dc2626',
            color: 'white',
            cursor: 'pointer',
            marginBottom: '30px',
            boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)',
            animation: alertTriggered ? 'pulse 0.5s infinite' : 'none'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.08)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          🚨 EMERGENCY SOS
        </button>

        {/* Emergency Contacts */}
        <div style={{
          backgroundColor: '#f7fafc',
          padding: '20px',
          borderRadius: '10px',
          marginTop: '20px',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#2d3748', marginBottom: '15px' }}>📞 Emergency Contacts</h3>
          {emergencyContacts.map((contact) => (
            <div
              key={contact.id}
              style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '8px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #e2e8f0'
              }}
            >
              <span style={{ color: '#2d3748', fontWeight: 'bold' }}>{contact.name}</span>
              <span style={{ color: '#718096' }}>{contact.phone}</span>
            </div>
          ))}
        </div>

        {/* User Phone Input */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ color: '#4a5568', display: 'block', marginBottom: '8px' }}>
            Your Phone Number:
          </label>
          <input
            type="tel"
            value={userPhone}
            onChange={(e) => setUserPhone(e.target.value)}
            placeholder="+91 your number"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e0',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Footer */}
        <p style={{ color: '#a0aec0', fontSize: '12px', marginTop: '20px' }}>
          Stay safe. Your safety is our priority. 🛡️
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
