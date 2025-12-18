interface NodeConnectorProps {
  leftStart: string[],
  rightEnd: string[],
  width?: number,
  itemHeight: number,
  connectMap: Record<string, string[]>
}


function NodeConnector({
  leftStart = [],
  rightEnd = [],
  width = 120,
  itemHeight,
  connectMap,
}: NodeConnectorProps) {
  return (
    <canvas className="h-full"></canvas>
  );
}

export default NodeConnector;