import { Conversation, ConversationStore } from './sdk-types';

export class InMemoryConversationStore implements ConversationStore {
  private readonly messageStore = new Map<string, Conversation>();

  public async get(messageId: string): Promise<Conversation | undefined> {
    return this.messageStore.get(messageId);
  }

  public async set(message: Conversation): Promise<void> {
    this.messageStore.set(message.messageId, { ...message });
  }

  public async clear(): Promise<void> {
    this.messageStore.clear();
  }
}
