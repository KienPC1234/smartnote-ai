'use client';

let dbPromise: Promise<any> | null = null;
let pipePromise: any = null;

const NODE_SCHEMA = {
    title: 'node schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        title: { type: 'string' },
        content: { type: 'string' },
        embedding: {
            type: 'array',
            items: { type: 'number' }
        },
        updatedAt: { type: 'string' }
    },
    required: ['id', 'title', 'content', 'embedding']
};

export async function getVectorPipe() {
    if (typeof window === 'undefined') return null;
    if (!pipePromise) {
        try {
            // Fix for transformers.js evaluation error in some Next.js/Webpack environments
            // env.js tries to check process.env which might be problematic
            if (typeof (window as any).process === 'undefined') {
                (window as any).process = { env: {} };
            } else if (typeof (window as any).process.env === 'undefined') {
                (window as any).process.env = {};
            }

            // Dynamic import to avoid SSR errors
            const { pipeline, env } = await import('@xenova/transformers');
            
            // Disable local model check in browser to use remote HF models
            if (env) {
                env.allowLocalModels = false;
                // @ts-ignore
                env.useBrowserCache = true;
            }

            pipePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        } catch (e) {
            console.error("[VectorService] Pipeline init error:", e);
            return null;
        }
    }
    return pipePromise;
}

export async function getEmbedding(text: string): Promise<number[]> {
    const pipe = await getVectorPipe();
    if (!pipe) return [];
    
    try {
        const output = await pipe(text, {
            pooling: 'mean',
            normalize: true,
        });
        return Array.from(output.data);
    } catch (e) {
        console.error("[VectorService] Embedding error:", e);
        return [];
    }
}

export async function getDatabase() {
    if (typeof window === 'undefined') return null;
    if (!dbPromise) {
        dbPromise = (async () => {
            try {
                const { createRxDatabase } = await import('rxdb');
                const { getRxStorageDexie } = await import('rxdb/plugins/storage-dexie');

                const db = await createRxDatabase({
                    name: 'smartnote_vectors',
                    storage: getRxStorageDexie(),
                    ignoreDuplicate: true
                });

                await db.addCollections({
                    nodes: {
                        schema: NODE_SCHEMA
                    }
                });

                return db;
            } catch (e) {
                console.error("[VectorService] DB init error:", e);
                return null;
            }
        })();
    }
    return dbPromise;
}

export async function upsertNode(node: { id: string, title: string, content: string, updatedAt: string }) {
    const db = await getDatabase();
    if (!db) return;

    try {
        // Quick check if node exists and is up to date
        const existing = await db.nodes.findOne(node.id).exec();
        if (existing && existing.updatedAt === node.updatedAt) {
            return;
        }

        const embedding = await getEmbedding(`${node.title}\n${node.content}`);
        
        await db.nodes.upsert({
            ...node,
            embedding
        });
    } catch (e) {
        console.error("[VectorService] Upsert error:", e);
    }
}

// Cosine similarity - often better for text
function cosineSimilarity(v1: number[], v2: number[]) {
    if (!v1 || !v2 || v1.length !== v2.length) return 0;
    const dotProduct = v1.reduce((sum, val, i) => sum + val * v2[i], 0);
    const mag1 = Math.sqrt(v1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(v2.reduce((sum, val) => sum + val * val, 0));
    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
}

export interface VectorNode {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
    embedding: number[];
    score: number;
}

export async function searchNodes(query: string, limit: number = 5): Promise<VectorNode[]> {
    const db = await getDatabase();
    if (!db) return [];

    try {
        const queryEmbedding = await getEmbedding(query);
        const allDocs = await db.nodes.find().exec();
        
        const results: VectorNode[] = allDocs.map((doc: any) => {
            const node = doc.toJSON();
            const score = cosineSimilarity(queryEmbedding, node.embedding);
            return { ...node, score } as VectorNode;
        });

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    } catch (e) {
        console.error("[VectorService] Search error:", e);
        return [];
    }
}
