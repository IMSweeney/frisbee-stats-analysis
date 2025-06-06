import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

import { BASE } from './constants';
import TeamSelector from './TeamSelect';

interface GamesResponse {
  games: Array<Game>
}

interface Game {
  gameID: String
  awayTeamID: String
  homeTeamID: String
}

interface GameEventsResponse {
  data: {
    homeEvents: Array<Event>
    awayEvents: Array<Event>
  }
}

interface Event {

}

enum EventType {
  DLine = 1,
  OLine = 2,
  Pull = 7,
  Turnover = 22,
  Throw = 18,
  Goal = 19,
}

function Events(teamIndex: string, teamID: string) {
  const [games, setGames] = useState<Game[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch(`${BASE}/web-v1/games?current&teamID=${teamIndex}`).then((res) => {
      return res.json();
    })
    .then((data) => {
      let games = (data as GamesResponse).games;
      console.log(games);
      setGames(games);
    });
  }, [teamID]);

  useEffect(() => {
    games.forEach((game) => {
      fetch(`${BASE}/api/v1/gamesEvents?gameID=${game.gameID}`).then((res) => {
        return res.json();
      })
      .then((data) => {
        let newEvents;
        if (game.awayTeamID == teamID) {
          newEvents = (data as GameEventsResponse).data.awayEvents;
        } else {
          newEvents = (data as GameEventsResponse).data.homeEvents;
        }
        console.log(newEvents);
        setEvents({...events, ...newEvents});
      });
    });
  }, [teamIndex, teamID, games]);

  return ();
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div> 
          <TeamSelector />
        </div>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
