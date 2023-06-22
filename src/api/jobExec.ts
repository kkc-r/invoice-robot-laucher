import { JobMode } from '../context/ActionContext';
import { JOB_EXEC_URL } from '../util/constants';
import { post } from './fetch';

export type JobInfoApiFormat = {
  id: number;
  status: string;
  validityPeriodSeconds: number;
  jobInquiryCode: string;
};

const FORM_DATA_NAME_JOB_INFO = 'jobInfo';

export const fetchJobExec = async ({
  token,
  isDev,
  appInstanceId,
  serviceClass,
  settingsUrl,
  mode,
  deadline,
  makeLeapsId,
  makeLeapsPasswod,
  robotProcess,
}: {
  token: string;
  isDev: boolean;
  appInstanceId: string;
  serviceClass: string;
  settingsUrl: string;
  mode: JobMode;
  deadline: string;
  makeLeapsId: string;
  makeLeapsPasswod: string;
  robotProcess: string;
}): Promise<{ ok: true; jobCode: string; jobId: number } | { ok: false; errorCode: string }> => {
  const jsonData = JSON.stringify({
    parameters: {
      postCustomParameter_settingsUrl: { text: settingsUrl },
      postCustomParameter_processMode: { text: mode },
      postCustomParameter_cutOffDate: { text: deadline },
      postCustomParameter_makeLeaps: {
        password: makeLeapsPasswod,
        text: makeLeapsId,
      },
      postCustomParameter_customerID: { text: robotProcess },
    },
  });
  const form = new FormData();
  form.append(FORM_DATA_NAME_JOB_INFO, jsonData);

  try {
    const response = await post<JobInfoApiFormat>(JOB_EXEC_URL(isDev, appInstanceId), {
      headers: {
        accept: 'application/json',
        'X-Request-ServiceClass': serviceClass,
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    return Promise.all([response]).then((response) => {
      if (response != null && response[0]) {
        return { ok: true, jobCode: response[0].jobInquiryCode, jobId: response[0].id };
      } else {
        return { ok: false, errorCode: '' };
      }
    });
  } catch (error) {
    return { ok: false, errorCode: '' };
  }
};
