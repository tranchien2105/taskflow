import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
    private readonly client: Client;

    constructor() {
        this.client = new Client({
            node: 'http://elasticsearch:9200',
        });
    }

    async onModuleInit(): Promise<void> {
        const maxRetries = 20;
        const retryDelay = 5000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.client.info();

                console.log(
                    'Elasticsearch connected:',
                    response.version.number,
                );

                return;
            } catch (error) {
                console.log(
                    `Elasticsearch not ready. Retry ${attempt}/${maxRetries}...`,
                );

                if (attempt === maxRetries) {
                    throw error;
                }

                await new Promise((resolve) =>
                    setTimeout(resolve, retryDelay),
                );
            }
        }
    }

    async bulkIndex(
        index: string,
        documents: Record<string, any>[],
    ): Promise<void> {
        if (documents.length === 0) {
            return;
        }

        const operations = documents.flatMap((document) => [
            {
                index: {
                    _index: index,
                    _id: document.id,
                },
            },
            document,
        ]);

        const response = await this.client.bulk({
            operations,
            refresh: true,
        });

        if (response.errors) {
            console.error(
                'Elasticsearch bulk indexing has errors',
            );

            throw new Error(
                'Elasticsearch bulk indexing failed',
            );
        }
    }

    async search(
        index: string,
        keyword?: string,
        status?: string,
        priority?: string,
        page = 1,
        limit = 10,
    ): Promise<{
        data: Record<string, any>[];
        total: number;
    }> {
        const must: Record<string, any>[] = [];
        const filter: Record<string, any>[] = [];

        if (keyword) {
            must.push({
                multi_match: {
                    query: keyword,
                    fields: ['title', 'description'],
                },
            });
        }

        if (status) {
            filter.push({
                term: {
                    status,
                },
            });
        }

        if (priority) {
            filter.push({
                term: {
                    priority,
                },
            });
        }

        const from = (page - 1) * limit;

        const response = await this.client.search({
            index,
            from,
            size: limit,
            query: {
                bool: {
                    must,
                    filter,
                },
            },
        });

        const data = response.hits.hits.map(
            (hit) =>
                hit._source as Record<string, any>,
        );

        const total =
            typeof response.hits.total === 'number'
                ? response.hits.total
                : response.hits.total?.value ?? 0;

        return {
            data,
            total,
        };
    }
}

