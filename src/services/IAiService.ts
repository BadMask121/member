export interface IAiService {
  embedding(value: string): Promise<number[]>;

  embeddings(value: string): Promise<Array<{ embedding: number[]; content: string }>>;
}
