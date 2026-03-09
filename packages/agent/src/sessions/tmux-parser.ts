/**
 * Parser for tmux control mode protocol.
 *
 * tmux -C outputs structured lines:
 *   %output %<pane-id> <data>   - terminal output (octal-escaped)
 *   %exit [reason]              - session ended
 *   %begin <time> <num> <flags> - command response start
 *   %end <time> <num> <flags>   - command response end (flags: 0=ok, 1=error)
 */

import { EventEmitter } from 'events';

export interface TmuxOutputEvent {
  paneId: string;
  data: string;
}

export interface TmuxCommandResult {
  id: number;
  error: boolean;
  output: string;
}

export class TmuxOutputParser extends EventEmitter {
  private buffer = '';
  private commandOutput: string[] = [];
  private inCommand = false;

  feed(chunk: string): void {
    this.buffer += chunk;

    let idx: number;
    while ((idx = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 1);
      this.parseLine(line);
    }
  }

  private parseLine(line: string): void {
    if (line.startsWith('%output ')) {
      this.handleOutput(line);
    } else if (line.startsWith('%exit')) {
      this.emit('exit', line.slice(5).trim() || undefined);
    } else if (line.startsWith('%begin ')) {
      this.inCommand = true;
      this.commandOutput = [];
    } else if (line.startsWith('%end ')) {
      this.handleEnd(line);
    } else if (this.inCommand) {
      this.commandOutput.push(line);
    }
  }

  private handleOutput(line: string): void {
    // Format: %output %<pane-id> <data>
    // After "%output " (8 chars), we have "%<number> <data>"
    const rest = line.slice(8);
    const spaceIdx = rest.indexOf(' ');

    if (spaceIdx === -1) return;

    const paneId = rest.slice(0, spaceIdx);
    const rawData = rest.slice(spaceIdx + 1);
    const data = unescapeTmuxData(rawData);

    this.emit('output', { paneId, data } as TmuxOutputEvent);
  }

  private handleEnd(line: string): void {
    // Format: %end <time> <number> <flags>
    const parts = line.split(' ');
    if (parts.length >= 4) {
      const id = parseInt(parts[2], 10);
      const error = parts[3] !== '0';
      this.emit('command-result', {
        id,
        error,
        output: this.commandOutput.join('\n'),
      } as TmuxCommandResult);
    }
    this.inCommand = false;
    this.commandOutput = [];
  }
}

/**
 * Unescape tmux control mode octal encoding.
 *
 * tmux escapes bytes < 0x20 and 0x7f as \ooo (3-digit octal).
 * Backslash is escaped as \\.
 */
export function unescapeTmuxData(data: string): string {
  return data.replace(/\\(\\|[0-7]{3})/g, (_, seq: string) => {
    if (seq === '\\') return '\\';
    return String.fromCharCode(parseInt(seq, 8));
  });
}
