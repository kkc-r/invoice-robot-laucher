import { APP_INSTANCE_URL } from '../util/constants';
import { get } from './fetch';

export type AppInstances = Array<{
  id: number;
  name: string;
  serviceClass: string;
}>;

export type AppInstancesApiFormat = {
  results: Array<{
    id: number;
    name: string;
    serviceClass: string;
  }>;
};

const itemsPerPage = 50;
const page = 1;
const order = 'asc';
const sortName = 'name';
const sortId = 'id';
const query = `?itemsPerPage=${itemsPerPage}&page=${page}&order=${order}&sort=${sortName}&order=${order}&sort=${sortId}`;

export const fetchAppInstances = async (token: string, isDev: boolean): Promise<AppInstances> => {
  const url = APP_INSTANCE_URL(isDev) + query;
  const response = await get<AppInstancesApiFormat>(url, {
    headers: {
      'Content-Type': `application/json;charset=utf-8`,
      Authorization: `Bearer ${token}`,
    },
  });
  if (response) {
    return response.results.map(({ id, name, serviceClass }) => ({
      id,
      name,
      serviceClass,
    }));
  } else {
    return [];
  }
};
