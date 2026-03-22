declare module 'node-irsdk' {
  interface IRacingSDK {
    on(event: string, callback: (data: { data: Record<string, unknown> }) => void): void;
  }
  function init(): IRacingSDK;
  export default { init };
  export { init };
}
