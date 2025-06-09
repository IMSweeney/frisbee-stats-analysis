import { useEffect, useState, useRef } from 'react';
import { GraphCanvas, GraphNode, GraphEdge, GraphCanvasRef, useSelection } from 'reagraph';
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
    let maxNodeSize = 0;
    let maxEdgeSize = 0;

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
        maxNodeSize = Math.max(node.size, maxNodeSize);
      }

      const edgeId = `${event.thrower}-${event.receiver}`;
      if (!_edges.has(edgeId)) {
        _edges.set(edgeId, {
          id: edgeId,
          source: event.thrower,
          target: event.receiver,
          size: 1
        });
      }
      let edge = _edges.get(event.thrower);
      if (edge?.size) {
        edge.size += 1;
        maxEdgeSize = Math.max(maxEdgeSize, edge.size);
      }
    });

    let nodeArr = Array.from(_nodes.values());
    let edgeArr = Array.from(_edges.values());

    for (let node of nodeArr) {
      if (node.size) {
        node.size = (node.size / maxNodeSize) * 25;
      }
    }
    for (let edge of edgeArr) {
      if (edge.size) {
        edge.size = Math.min(1, (edge.size / maxEdgeSize) * 10);
      }
    }

    console.log(nodeArr);
    console.log(edgeArr);
    setNodes(nodeArr);
    setEdges(edgeArr);
  }, [props.events]);

  const graphRef = useRef<GraphCanvasRef | null>(null);
  const {
    selections,
    actives,
    onNodeClick,
    onCanvasClick,
    onNodePointerOver,
    onNodePointerOut
  } = useSelection({
    ref: graphRef,
    nodes,
    edges,
    pathSelectionType: 'all'
  });

  return props.events.length != 0 ? (
    <div style={{ position: "fixed", width: '100%', height: '75%'}}>
      <GraphCanvas
        selections={selections}
        actives={actives}
        ref={graphRef}
        sizingType='attribute'
        sizingAttribute='size'
        minNodeSize={2}
        nodes={nodes}
        edges={edges}
        draggable
        edgeInterpolation='curved'
        onCanvasClick={onCanvasClick}
        onNodeClick={onNodeClick}
        onNodePointerOver={onNodePointerOver}
        onNodePointerOut={onNodePointerOut}
      />
    </div>
  ) :
  (
    <div>
      <p>No data loaded</p>
    </div>
  );
}