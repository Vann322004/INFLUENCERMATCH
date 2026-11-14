import apiClient from '../apiClient';
import { createDataManagerQuery } from '../dataManagerCache';

export interface Niche {
  id: string;
  name: string;
  description: string;
  active: boolean;
  keywords: string[];
}

export type NicheInput = Omit<Niche, 'id'>;

export const nicheService = {
  list: createDataManagerQuery('niches', async (): Promise<Niche[]> => {
    const { data } = await apiClient.get('/data/crawl-fields');
    if (!Array.isArray(data?.data)) throw new Error('Danh mục ngành hàng trả về không hợp lệ.');
    return data.data;
  }, { tags: ['taxonomy'] }),
  async create(input: NicheInput): Promise<Niche> {
    const { data } = await apiClient.post('/data/crawl-fields', input);
    return data.data;
  },
  async update(id: string, input: NicheInput): Promise<Niche> {
    const { data } = await apiClient.put(`/data/crawl-fields/${id}`, input);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/data/crawl-fields/${id}`);
  },
};
