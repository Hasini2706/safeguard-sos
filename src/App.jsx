import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://yrhhehjiibbekgzbmupz.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyaGhlaGppaWJiZWtnemJtdXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5NjM3NjYsImV4cCI6MTc2MjQ5OTc2Nn0.xYz_placeholder'
);

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: 'Mom', phone: '+919876543210' },
    { id: 2, name: 'Dad', phone: '+919876543211' },
    { id: 3, name: 'Police', phone: '100' }
  ]);
  const [userPhone, setUserPhone] = useState('+91');
  const [statusMessage, setStatusMessage] = useState('Ready to monitor');
  const [editingContactId, setEditingContactId] = useState(null);
  const [editingPhone, setEditingPhone] = useState('');
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const streamRef = useRef(null);

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

  const monitorAudio = () => {
    if (!analyzerRef.current) return;
    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average);
    if (average > 30 && !alertTriggered) {
      triggerEmergencyAlert();
    }
    if (isListening) {
      requestAnimationFrame(monitorAudio);
    }
  };

  const stopAudioMonitoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
    setAudioLevel(0);
    setStatusMessage('Monitoring stopped');
  };

  const triggerEmergencyAlert = async () => {
    setAlertTriggered(true);
    setStatusMessage('🚨 EMERGENCY ALERT TRIGGERED!');
    for (const contact of emergencyContacts) {
      await sendSMS(contact.phone, `URGENT: ${contact.name}, Help needed! Emergency detected.`);
    }
    playAlertSound();
    setTimeout(() => {
      setAlertTriggered(false);
      setStatusMessage('Alert sent!');
    }, 5000);
  };

  const handleManualSOS = async () => {
    setAlertTriggered(true);
    setStatusMessage('🚨 MANUAL SOS ACTIVATED!');
    for (const contact of emergencyContacts) {
      await sendSMS(contact.phone, `EMERGENCY: Manual SOS activated by ${userPhone}! Need immediate help.`);
    }
    playAlertSound();
    setTimeout(() => {
      setAlertTriggered(false);
      setStatusMessage('Alert sent!');
    }, 5000);
  };

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

  const playAlertSound = () => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  };

  const updateContactPhone = (id, newPhone) => {
    setEmergencyContacts(emergencyContacts.map(contact =>
      contact.id === id ? { ...contact, phone: newPhone } : contact
    ));
    setEditingContactId(null);
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
        <h1 style={{ color: '#2d3748', marginBottom: '10px', fontSize: '32px' }}>
          🛡️ SafeGuard SOS
        </h1>
        <p style={{ color: '#718096', marginBottom: '30px', fontSize: '16px' }}>
          Personal Safety System with Audio Detection
        </p>

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
              transition: 'width 0.1s ease'
            }}></div>
          </div>
        </div>

        <button
          onClick={isListening ? stopAudioMonitoring : startAudioMonitoring}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: isListening ? '#f56565' : '#48bb78',
            color: 'white',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          {isListening ? '⏹️ Stop Monitoring' : '🎤 Start Monitoring'}
        </button>

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
            boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)'
          }}
        >
          🚨 EMERGENCY SOS
        </button>

        <div style={{
          backgroundColor: '#f7fafc',
          padding: '20px',
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#2d3748', marginBottom: '15px', textAlign: 'left' }}>📞 Emergency Contacts</h3>
          {emergencyContacts.map((contact) => (
            <div
              key={contact.id}
              style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '8px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #e2e8f0'
              }}
            >
              <span style={{ color: '#2d3748', fontWeight: 'bold', minWidth: '80px' }}>{contact.name}</span>
              {editingContactId === contact.id ? (
                <div style={{ display: 'flex', gap: '5px', flex: 1 }}>
                  <input
                    type="tel"
                    value={editingPhone}
                    onChange={(e) => setEditingPhone(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '5px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e0',
                      fontSize: '12px'
                    }}
                  />
                  <button
                    onClick={() => updateContactPhone(contact.id, editingPhone)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <span style={{ color: '#718096' }}>{contact.phone}</span>
                  <button
                    onClick={() => {
                      setEditingContactId(contact.id);
                      setEditingPhone(contact.phone);
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✍️ Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

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

        <p style={{ color: '#a0aec0', fontSize: '12px', marginTop: '20px' }}>
          Stay safe. Your safety is our priority. 🛡️
        </p>
      </div>
    </div>
  );
}
