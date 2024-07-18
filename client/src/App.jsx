
import { useEffect, useState } from 'react';
import Toothless from './components/toothless/toothless';
import Snack from './components/snack/snack';
import Counter from './components/counter/counter';
// import Connect from './components/connect/connect';
import './App.css';
import TikTokIOConnection from './clientWrapper.js';
import video from "./assets/video.mp4";

const tiktokConnection = new TikTokIOConnection("http://localhost:8081");

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {

    tiktokConnection.on("like", (data) => {
      setData(data);
    });



    tiktokConnection.on('connect', () => {
      console.log('Connected to server');
    });

    tiktokConnection.on('disconnect', () => {
      console.log('Disconnected from server');
    });


    // Start the connection to TikTok on mount
    tiktokConnection.connect();

    return () => {
      tiktokConnection.socket.off("data");
      tiktokConnection.socket.off("connect");
      tiktokConnection.socket.off("disconnect");
      tiktokConnection.socket.off("tiktokConnected");
      tiktokConnection.socket.off("tiktokDisconnected");
      tiktokConnection.socket.off("streamEnd");
    };
  }, []);

  return (
    <>
      <video autoPlay muted loop id="myVideo">
        <source src={video} type="video/mp4" />
      </video>

      <div>
        <Snack />
        <Counter data={data}/>
        <Toothless />
        {/* <Connect data={data}/> */}
      </div>
    </>
  );
}

export default App;
