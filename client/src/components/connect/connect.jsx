// src/components/SocketComponent.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8081');

const Connect = () => {
  const [message, setMessage] = useState('');
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('tiktokConnected', (state) => {
      setMessage(`Connected to room ${state.roomId}`);
      setConnected(true);
    });

    socket.on('tiktokDisconnected', (reason) => {
      setMessage(`Disconnected: ${reason}`);
      setConnected(false);
    });

    socket.on('chat', (msg) => {
      console.log('Chat message received:', msg);
    });
 
    // Cleanup on component unmount
    return () => {
      socket.off('tiktokConnected');
      socket.off('tiktokDisconnected');
      socket.off('chat');
    };
  }, []);

  const connectToTikTok = () => {
    socket.emit('setUniqueId', input);
  };

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter Unique ID"
      />
      <button onClick={connectToTikTok} disabled={connected}>Connect</button>
      <p>{message}</p>
    </div>
  );
};

export default Connect;
