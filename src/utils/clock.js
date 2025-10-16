// Clock provider for testable time-dependent code
export class Clock {
  now() {
    return new Date();
  }
}

export const clock = new Clock();
