import { LOGOUT_REDIRECT, RSI_HOST } from '../util/constants';

export type JobInfoApiFormat = {
  id: number;
  status: string;
  validityPeriodSeconds: number;
  jobInquiryCode: string;
};

export const fetchLogOut = async (isDev: boolean, token: string | null) => {
  if (token == null) {
    return;
  }

  const logoutURL = `${RSI_HOST(isDev)}/portal/logout.html?url=${LOGOUT_REDIRECT(isDev)}`;
  window.localStorage.clear();
  window.location.assign(logoutURL);
};
