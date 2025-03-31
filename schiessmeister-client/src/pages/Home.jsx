import { useState } from "react";

const Home = () => {
    const competitions = [
        'Sedef',
        'Timon',
        'Luca'
    ]

  return (
    <div>
      <h2>Wettbewerb öffnen</h2>
        <div>
        {competitions.map(comp => (
                    <button key={comp}>{comp}</button>
                ))}
        </div>
      <h2>Wettbewerb erstellen</h2>
      <button type ="submit">Erstellen</button>
    </div>
  );
};

export default Home;
