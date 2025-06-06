import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { BASE } from './constants';
import TeamSelector, { Team } from './TeamSelect';
import PassingChart from './PassingChart';

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

export interface Event {
  timestamp: number,
  type: number,
  thrower: string,  
  receiver: string,
}

export enum EventType {
  DLine = 1,
  OLine = 2,
  Pull = 7,
  Turnover = 22,
  Throw = 18,
  Goal = 19,
}

interface Props {
  events: Array<Event>
}

function EventsTable(props: Props) {
  const columns: GridColDef[] = [
    { field: 'timestamp'},
    { field: 'type'},
    { field: 'thrower'},
  ];
  const paginationModel = { page: 0, pageSize: 5 };

  return (
    <DataGrid
      rows={props.events}
      getRowId={(_: Event) => crypto.randomUUID()}
      columns={columns}
      initialState={{ pagination: { paginationModel } }}
      pageSizeOptions={[5, 10, 100]}
    />
  );
}

function App() {
  const [team, setTeam] = useState<Team | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!team?.index) {
      return;
    }
    fetch(`${BASE}/web-v1/games?current&teamID=${team?.index + 1}`).then((res) => {
      return res.json();
    })
    .then((data) => {
      let games = (data as GamesResponse).games;
      console.log(games);
      setGames(games);
      setEvents([]);
    });
  }, [team]);

  useEffect(() => {
    Promise.all(games.map(
      game => fetch(`${BASE}/api/v1/gameEvents?gameID=${game.gameID}`)
      .then(res => res.json())
    )).then(allEvents => {
      let newEvents: Array<Event> = [];
      allEvents.forEach((value, index) => {
        if (games[index].awayTeamID == team?.teamID) {
          newEvents = newEvents.concat((value as GameEventsResponse).data.awayEvents);
        } else {
          newEvents = newEvents.concat((value as GameEventsResponse).data.homeEvents);
        }
      })
      setEvents(newEvents);
    });
  }, [games]);

  function onTeamChange(team: Team): void {
    console.log(team);
    setTeam(team);
  };
  return (
    <div className="App">
      <div> 
        <TeamSelector onChange={onTeamChange}/>
        <EventsTable events={events} />
      </div>
      <div>
        <PassingChart events={events}/>
      </div>
      <p>{team?.fullName}</p>
    </div>
  );
}

export default App;
