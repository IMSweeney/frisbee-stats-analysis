import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { BASE } from './constants';
import TeamSelector, { Team } from './TeamSelect';

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
  timestamp: number,
  type: number,
  thrower: string,
}

enum EventType {
  DLine = 1,
  OLine = 2,
  Pull = 7,
  Turnover = 22,
  Throw = 18,
  Goal = 19,
}

interface Props {
  team: Team | null
}

function Events(props: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!props.team?.index) {
      return;
    }
    fetch(`${BASE}/web-v1/games?current&teamID=${props.team?.index + 1}`).then((res) => {
      return res.json();
    })
    .then((data) => {
      let games = (data as GamesResponse).games;
      console.log(games);
      setGames(games);
      setEvents([]);
    });
  }, [props.team]);

  useEffect(() => {
    games.forEach((game) => {
      fetch(`${BASE}/api/v1/gameEvents?gameID=${game.gameID}`).then((res) => {
        return res.json();
      })
      .then((data) => {
        let newEvents;
        if (game.awayTeamID == props.team?.teamID) {
          newEvents = (data as GameEventsResponse).data.awayEvents;
        } else {
          newEvents = (data as GameEventsResponse).data.homeEvents;
        }
        console.log(newEvents);
        setEvents([...events, ...newEvents]);
        console.log(events.length)
      });
    });
  }, [props.team, games]);

  const columns: GridColDef[] = [
    { field: 'timestamp'},
    { field: 'type'},
    { field: 'thrower'},
  ];
  function getRowId(row: Event) {
    return row.timestamp;
  }
  const paginationModel = { page: 0, pageSize: 5 };

  return (
    <DataGrid
      rows={events}
      getRowId={getRowId}
      columns={columns}
      initialState={{ pagination: { paginationModel } }}
      pageSizeOptions={[5, 10, 100]}
    />
  );
}

function App() {
  const [team, setTeam] = useState<Team | null>(null);

  function onTeamChange(team: Team): void {
    console.log(team);
    setTeam(team);
  };
  return (
    <div className="App">
      <div> 
        <TeamSelector onChange={onTeamChange}/>
        <Events team={team} />
      </div>
      <p>{team?.fullName}</p>
    </div>
  );
}

export default App;
