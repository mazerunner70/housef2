export class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  info(action: string, data?: Record<string, any>) {
    this.log('INFO', action, data);
  }

  error(action: string, data?: Record<string, any>) {
    this.log('ERROR', action, data);
  }

  warn(action: string, data?: Record<string, any>) {
    this.log('WARN', action, data);
  }

  private log(level: string, action: string, data?: Record<string, any>) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      action,
      ...data && { data },
    };

    console.log(JSON.stringify(entry));
  }
} 