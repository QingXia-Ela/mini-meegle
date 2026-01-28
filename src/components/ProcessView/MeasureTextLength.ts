const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

export function measureTextLength(text: string, fontSize: number) {
  if (!context) {
    return 0;
  }
  context.font = `${fontSize}px Arial`;
  return context.measureText(text).width;
}