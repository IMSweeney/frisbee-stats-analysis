from dataclasses import dataclass
from enum import Enum
from typing import Optional
import requests
import math

from loguru import logger
from tqdm import tqdm
import plotly.express as px
import pandas as pd


BASE = 'https://www.backend.ufastats.com'

class EventType(Enum):
    DLine = 1
    OLine = 2
    Pull = 7
    Turnover = 22
    Throw = 18
    Goal = 19


@dataclass
class Event:
    timestamp: int
    type: int
    team: str

@dataclass
class LineEvent(Event):  # type 1 = D, type 2 = O
    line: list[str]
    time: int

@dataclass
class Pull(Event):  # type 7
    puller: str
    pullX: float
    pullY: float
    pullMs: int

# Unkown events
# Type 13, 15, 16

@dataclass
class Turnover(Event):  # type 22
    thrower: str
    throwerX: float
    throwerY: float
    turnoverX: float
    turnoverY: float
    throwerSector: int = 0
    turnoverSector: int = 0

@dataclass(frozen=True)
class Sector:
    x: int
    y: int

@dataclass
class Throw(Event):  # type 18 (field), 19 (goal)
    thrower: str
    throwerX: float
    throwerY: float
    receiver: str
    receiverX: float
    receiverY: float
    throwerSector: int = 0
    receiverSector: int = 0

def parse_event(event: dict) -> Event:
    if event['type'] in (EventType.OLine.value, EventType.DLine.value):
        return LineEvent(**event)
    elif event['type'] == EventType.Pull.value:
        return Pull(**event)
    elif event['type'] == EventType.Turnover.value:
        return Turnover(**event)
    elif event['type'] in (EventType.Throw.value, EventType.Goal.value):
        return Throw(**event)
    

def add_field_sector_info_to_throws(throws: list[Throw], width_yards: int):
    for throw in throws:
        throw.throwerSector = Sector(throw.throwerX // width_yards, throw.throwerY // width_yards)
        throw.receiverSector = Sector(throw.receiverX // width_yards, throw.receiverY // width_yards)
    return throws


def add_field_sector_info_to_turns(turns: list[Turnover], width_yards: int):
    for throw in turns:
        throw.throwerSector = Sector(throw.throwerX // width_yards, throw.throwerY // width_yards)
        throw.turnoverSector = Sector(throw.turnoverX // width_yards, throw.turnoverY // width_yards)
    return turns


@dataclass
class Edge:
    left: "Node"
    right: "Node"
    weight: int

@dataclass
class Node:
    sector: Sector
    edges: list[Edge]
    value: float = 0

    def add_edge(self, e: Edge):
        self.edges.append(e)

"""
3 node graph
A - B - C
3 edges
A - B pass
A - B turn
B - C goal

weight of A? .5
weight of B? 1
weight of C? undefined (or 0)

iter 1 -> A (-1), B (1), C (0)
iter 2 -> A (1 + -1), B (1), C (0)
"""


def calc_values(nodes: dict[Sector, Node], iterations: int = 10):
    for _ in range(iterations):
        err = 0
        for node in nodes.values():
            # logger.info(f'{node.sector=}: {[f"{e.right.sector},{e.weight}" for e in node.edges]}')
            # input()
            if not node.edges:
                continue
            value = 0
            # weight is odds of goal - odds of turnover + average value of non-goal outcome
            i = 0
            for edge in node.edges:
                if edge.weight != 0:
                    value += edge.weight
                elif edge.right.sector != node.sector:
                    value += edge.right.value
                else:
                    continue
                i += 1
            value = value / i
            err += abs(node.value - value)
            node.value = value
        logger.info(f"Avg err for iter: {err / len(nodes):.02f}")   


def get_events(team_ID: int, team_name: str):
    resp = requests.get(f'{BASE}/web-v1/games?current&teamID={team_ID}')
    for game in resp.json()['games']:
        game_data = requests.get(f'{BASE}/api/v1/gameEvents?gameID={game["gameID"]}')
        data = game_data.json()['data']
        events = []
        key = 'homeEvents' if game['homeTeamID'] == team_name else 'awayEvents'
            
        for event in data[key]:
            print(event)
            if 'timestamp' not in event:
                event['timestamp'] = 0
            e = parse_event({'team': team_name, **event})
            if e:
                events.append(e)

        return events


def main():
    events = get_events(22, 'cascades')  # SEA
    
    # The events are already normalized for direction of play!
    # generate throw graph
    #
    # break the field into sectors
    # create a graph of all sectors to all other sectors
    # terminate at goal or turnover...
    throws = [e for e in events if e.type in (EventType.Throw.value, EventType.Goal.value)]
    turns = [e for e in events if e.type == EventType.Turnover.value]
    YARDS_PER_SECTION = 5
    throws = add_field_sector_info_to_throws(throws, YARDS_PER_SECTION)
    turns = add_field_sector_info_to_turns(turns, YARDS_PER_SECTION)
    
    # calculate edges...
    nodes: dict[Sector, Node] = {}
    for throw in throws:
        if throw.throwerSector not in nodes:
            nodes[throw.throwerSector] = Node(throw.throwerSector, [])
        if throw.receiverSector not in nodes:
            nodes[throw.receiverSector] = Node(throw.receiverSector, [])
        if throw.type == EventType.Throw.value:
            weight = 0
        else:
            weight = 1
        nodes[throw.throwerSector].add_edge(Edge(
            nodes[throw.throwerSector],
            nodes[throw.receiverSector],
            weight=weight,
        ))
    for throw in turns:
        if throw.throwerSector not in nodes:
            nodes[throw.throwerSector] = Node(throw.throwerSector, [])
        if throw.turnoverSector not in nodes:
            nodes[throw.turnoverSector] = Node(throw.turnoverSector, [])
        nodes[throw.throwerSector].add_edge(Edge(
            nodes[throw.throwerSector],
            nodes[throw.turnoverSector],
            weight=-1,
        ))

    calc_values(nodes)
    
    for sector, node in nodes.items():
        logger.info(f'{sector}, value={node.value:.02f}, edges={len(node.edges)}')

    data = pd.DataFrame([{
        'x': n.sector.x * YARDS_PER_SECTION,
        'y': n.sector.y * YARDS_PER_SECTION,
        'value': n.value,
    } for n in nodes.values()])
    fig = px.density_heatmap(data, x="x", y="y", z="value", histfunc="avg", color_continuous_scale='prgn')
    fig.show()

if __name__ == '__main__':
    main()