export const CLI_OUTPUT = Symbol('CLI_OUTPUT');

export interface CliOutput {
  log(message: string): void;
  error(message: string): void;
}

export const CONSOLE_OUTPUT: CliOutput = {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
};
