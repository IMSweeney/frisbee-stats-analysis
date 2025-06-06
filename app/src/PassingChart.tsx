import { useEffect, useState } from 'react';
import { GraphCanvas, GraphNode, GraphEdge } from 'reagraph';
import { Event, EventType } from './App';

interface Props {
  events: Array<Event>
}

export default function PassingChart(props: Props) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);

  useEffect(() => {
    let _nodes: Map<string, GraphNode> = new Map();
    let _edges: Map<string, GraphEdge> = new Map();
    props.events.forEach(event => {
      if (!event.thrower || !event.receiver) { return; }
      if (!_nodes.has(event.thrower)) {
        _nodes.set(event.thrower, {
          id: event.thrower,
          label: event.thrower,
          size: 1
        });
      }
      let node = _nodes.get(event.thrower);
      if (node?.size) {
        node.size += 1;
      }

      const edgeId = `${event.thrower}-${event.receiver}`;
      if (!_edges.has(edgeId)) {
        _edges.set(edgeId, {
          id: edgeId,
          source: event.thrower,
          target: event.receiver,
          // size: 1
        });
      }
      let edge = _edges.get(event.thrower);
      if (edge?.size) {
        // edge.size = Math.max(edge.size + 1, 10)
      }
    });
    setNodes(Array.from(_nodes.values()));
    setEdges(Array.from(_edges.values()));
  }, props.events);

  return props.events.length != 0 ? (
    <div>
      <GraphCanvas
        // sizingType='attribute'
        // sizingAttribute='size'
        // minNodeSize={2}
        // maxNodeSize={25}
        nodes={nodes}
        edges={edges}
      />
    </div>
  ) :
  (
    <div>
      <p>No data loaded</p>
    </div>
  );
}