
export interface AiTask {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate?: string | Date | null;
}
