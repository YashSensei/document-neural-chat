export class ConversationStore {
    constructor() {
        this.entries = [];
    }

    async persist(data) {
        const record = { ...data, createdAt: new Date() };
        this.entries.unshift(record);
        return record;
    }

    async getHistory(limit = 50) {
        return this.entries.slice(0, limit);
    }
}
