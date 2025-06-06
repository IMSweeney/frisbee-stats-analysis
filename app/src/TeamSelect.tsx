import { useEffect, useState } from 'react';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { BASE } from './constants';


interface TeamsResponse {
  data: Array<Team>
}

interface Team {
  teamID: string,
  fullName: string,
}

export default function TeamSelector() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [team, setTeam] = useState<string | null>(null);

  const handleChange = (event: SelectChangeEvent<string | null>) => {
    console.log(event);
    setTeam(event.target.value);
  };

  useEffect(() => {
    fetch(`${BASE}/api/v1/teams?years=2025`).then((res) => {
      return res.json();
    })
    .then((data) => {
      let teams = (data as TeamsResponse).data;
      console.log(teams);
      setTeams(teams);
    });
  }, []);

  return (
    <FormControl fullWidth>
      <InputLabel id="team-select-label">Teams</InputLabel>
      <Select
        labelId="team-select-label"
        id="team-select"
        value={team}
        label="Teams"
        onChange={handleChange}
      >
        {teams && teams.map((item, index) => (
          <MenuItem value={index as unknown as string}>{item.fullName}</MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
