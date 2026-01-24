declare module 'cytoscape-edgehandles' {
  import type { Core, EdgeSingular, NodeSingular } from 'cytoscape';

  interface EdgehandlesOptions {
    canConnect?: (sourceNode: NodeSingular, targetNode: NodeSingular) => boolean;
    edgeParams?: (sourceNode: NodeSingular, targetNode: NodeSingular) => any;
    hoverDelay?: number;
    snap?: boolean;
    snapThreshold?: number;
    snapFrequency?: number;
    noEdgeEventsInDraw?: boolean;
    disableBrowserGestures?: boolean;
    handleNodes?: string;
    preview?: boolean;
    handlePosition?: string;
    handleInDrawMode?: boolean;
    edgeType?: (sourceNode: NodeSingular, targetNode: NodeSingular) => string;
  }

  interface EdgehandlesInstance {
    enable(): void;
    disable(): void;
    enableDrawMode(): void;
    disableDrawMode(): void;
    destroy(): void;
  }

  function edgehandles(cytoscape: any): void;

  export = edgehandles;

  module 'cytoscape' {
    interface Core {
      edgehandles(options?: EdgehandlesOptions): EdgehandlesInstance;
    }
  }
}
