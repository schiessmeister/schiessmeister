import { useState } from "react";
import '../styles/Participantslist.css'

const ParticipantsList = () => {
  const participants = ["Teilnehmer 1", "Teilnehmer 2", "Teilnehmer 3"];

  return (
    <div className="container">
      <h2>Teilnehmerliste</h2>
      <div className="participants">
        {participants.map((name, index) => (
          <div key={index} className="participant">
            <span>{name}</span>
            <div className="controls">
              <ul>
                <li>
                  <button>
                    <img src="/arrow-up.svg" alt="Nach oben" />
                  </button>
                </li>
                <li>
                  <button>
                    <img src="/arrow-down.svg" alt="Nach unten" />
                  </button>
                </li>
                <li>
                  <button>
                    <img src="/trash-icon.svg" alt="Löschen" />
                  </button>
                </li>
              </ul>
            </div>
          </div>
        ))}
      </div>
      <hr />
      <div className="participant-list">
        {participants.map((name, index) => (
          <button key={index} className="participant-button">{name}</button>
        ))}
      </div>
      <hr />
      <div className="actions">
        <input type="text" placeholder="Teilnehmer" />
        <div className="buttons">
          <button className="button--tertiary">+ Teilnehmer erstellen</button>
          <button type="submit">Speichern</button>
          <button type="reset" className="button--secondary">Abbrechen</button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;
