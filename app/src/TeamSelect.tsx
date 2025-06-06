import { useEffect, useState } from 'react';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { BASE } from './constants';


interface TeamsResponse {
  data: Array<Team>
}

export interface Team {
  index: string,
  teamID: string,
  fullName: string,
}

interface Props {
  onChange: (team: Team) => void
}

export default function TeamSelector(props: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [team, setTeam] = useState<Team | null>(null);

  const handleChange = (event: SelectChangeEvent<string | null>) => {
    const index = parseInt(event.target.value || '0');
    const team = {...teams[index], index: event.target.value || '0'};
    console.log(team);
    setTeam(team);
    props.onChange(team);
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
        value={team?.index}
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
