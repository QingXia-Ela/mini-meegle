import type { ComputePositionConfig } from '@floating-ui/dom';

declare module 'cytoscape-popper' {
  interface PopperOptions extends ComputePositionConfig {
  }
  interface PopperInstance {
    update(): void;
  }
}