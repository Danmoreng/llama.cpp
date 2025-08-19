import Dexie, { type EntityTable } from 'dexie';

class LlamacppDatabase extends Dexie {
  conversations!: EntityTable<DatabaseConversation, string>;
  messages!: EntityTable<DatabaseMessage, string>;
  settings!: EntityTable<DatabaseAppSettings, string>;

  constructor() {
    super('LlamacppWebui');

    // v1 schema (for reference)
    this.version(1).stores({
      conversations: 'id, lastModified, currNode, name',
      messages: 'id, convId, type, role, timestamp, parent, children',
      settings: 'id'
    });

    // v2: add toolCallId index, keep prior indexes
    this.version(2).stores({
      conversations: 'id, lastModified, currNode, name',
      messages: 'id, convId, type, role, timestamp, parent, children, toolCallId',
      settings: 'id'
    }).upgrade(tx =>
      tx.table('messages').toCollection().modify((m: any) => {
        // initialize new fields if missing
        m.contentParts ??= null;
        m.toolCalls ??= null;
        m.toolCallId ??= null;
        m.toolName ??= null;
        m.finishReason ??= null;
        m.usage ??= null;
      })
    );
  }
}

export const db = new LlamacppDatabase();
