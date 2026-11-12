import apiClient from '../apiClient';

export interface Niche {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export type NicheInput = Omit<Niche, 'id'>;

export const nicheService = {
  async list(): Promise<Niche[]> {
    const { data } = await apiClient.get('/data/niches');
    return data.data;
  },
  async create(input: NicheInput): Promise<Niche> {
    const { data } = await apiClient.post('/data/niches', input);
    return data.data;
  },
  async update(id: string, input: NicheInput): Promise<Niche> {
    const { data } = await apiClient.put(`/data/niches/${id}`, input);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/data/niches/${id}`);
  },
};
