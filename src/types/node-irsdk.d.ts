declare module 'node-irsdk' {
  interface IRacingSDK {
    on(event: string, callback: (data: any) => void): void;
  }
  function init(): IRacingSDK;
  export default { init };
  export { init };
}
