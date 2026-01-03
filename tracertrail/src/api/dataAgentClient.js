import { localDataStore } from './localDataStore';

const API_BASE_URL = '/api';

class RestEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async _fetch(path, options = {}) {
    const res = await fetch(`${API_BASE_URL}/${this.endpoint}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || res.statusText);
    }
    return res.json();
  }

  async list(sort = null, limit = null, options = {}) {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (limit) params.append('limit', limit);
    return this._fetch(`?${params.toString()}`, options);
  }

  async filter(criteria, sort = null, options = {}) {
    const params = new URLSearchParams();
    Object.entries(criteria).forEach(([key, value]) => {
      params.append(key, value);
    });
    if (sort) params.append('sort', sort);
    return this._fetch(`?${params.toString()}`, options);
  }

  async create(data) {
    return this._fetch('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id, updates) {
    return this._fetch(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async delete(id) {
    return this._fetch(`/${id}`, {
      method: 'DELETE',
    });
  }
}

// Hybrid Store: Uses API for core entities, LocalStorage for others
export const dataAgent = {
  ...localDataStore,
  entities: {
    ...localDataStore.entities,
    // Override specific entities with API implementations - DISABLED for local dev
    // Project: new RestEntity('projects'),
    // DataSource: new RestEntity('datasources'),
    // Dataset: new RestEntity('datasets'),
    // Issue: new RestEntity('issues'),
    VaultSolution: new RestEntity('vault'),
  }
};
