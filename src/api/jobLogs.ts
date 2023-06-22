import { JOB_LOGS_URL } from '../util/constants';
import { get } from './fetch';

export type JobLogs = {
  id: number;
  status: string;
  jobInquiryCode: string;
};

export type JobLogsApiFormat = {
  results: Array<JobLogs>;
};

const itemsPerPage = 50;
const page = 1;
const order = 'asc';
const sortName = 'name';
const sortId = 'id';

export const fetchJobLogs = async (
  token: string,
  isDev: boolean,
  appInstanceId: string,
  jobId: number
): Promise<JobLogs | null> => {
  const query = `?id=${jobId}&itemsPerPage=${itemsPerPage}&page=${page}&order=${order}&sort=${sortName}&order=${order}&sort=${sortId}`;
  const url = JOB_LOGS_URL(isDev, appInstanceId) + query;
  const response = await get<JobLogsApiFormat>(url, {
    headers: {
      'Content-Type': `application/json;charset=utf-8`,
      Authorization: `Bearer ${token}`,
    },
  });
  if (response && response.results.length > 0) {
    return response.results.map(({ id, status, jobInquiryCode }) => ({
      id,
      status,
      jobInquiryCode,
    }))[0];
  } else {
    return null;
  }
};
