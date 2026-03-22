declare module 'node-irsdk' {
  interface IRacingSDK {
    on(event: 'Telemetry', callback: (data: { data: Record<string, unknown> }) => void): void;
    on(event: 'SessionInfo', callback: (data: { data: Record<string, unknown> }) => void): void;
    on(event: string, callback: (data: { data: Record<string, unknown> }) => void): void;
  }
  function init(): IRacingSDK;
  export default { init };
  export { init };
}
