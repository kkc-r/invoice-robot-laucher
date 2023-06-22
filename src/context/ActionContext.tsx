import { FC, ReactNode, createContext, useContext, useState } from 'react';

export const JobMode = {
  /** C&PC明細書ZIP解凍 */
  UnzipStatement: 'UnzipStatement',
  /** C&PC明細書仕分け */
  SortStatement: 'SortStatement',
  /** 請求書仕分け */
  SortInvoice: 'SortInvoice',
  /** 請求書結合 */
  MergeInvoice: 'MergeInvoice',
  /** 請求書MakeLeaps登録 */
  UploadInvoice: 'UploadInvoice',
  None: 'None',
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type JobMode = (typeof JobMode)[keyof typeof JobMode];

export const JobStatus = {
  /** 未実行 */
  Stop: 'Stop',
  /** 実行待ち */
  Waiting: 'Waiting',
  /** 実行中 */
  Running: 'Running',
  /** 実行完了 */
  Finished: 'Finished',
  /** 実行失敗（ロボット強制終了 or 監視タイムアウト） */
  Failed: 'Failed',
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export type ActionStatus = {
  mode: JobMode;
  status: {
    UnzipStatement: JobStatus;
    SortStatement: JobStatus;
    SortInvoice: JobStatus;
    MergeInvoice: JobStatus;
    UploadInvoice: JobStatus;
    None: JobStatus;
  };
  jobCode: string;
  jobId: number;
};

export type ActionStatusContextType = {
  actionStatus: ActionStatus;
  setActionStatus: (status: ActionStatus) => void;
};

type Props = {
  children: ReactNode;
};

export const ActionStatusContext = createContext({} as ActionStatusContextType);
export const useActionStatus = () => useContext(ActionStatusContext);

export const ActionStatusProvider: FC<Props> = (props) => {
  const { children } = props;
  const [actionStatus, setActionStatus] = useState<ActionStatus>({
    mode: JobMode.None,
    status: {
      UnzipStatement: JobStatus.Stop,
      SortStatement: JobStatus.Stop,
      SortInvoice: JobStatus.Stop,
      MergeInvoice: JobStatus.Stop,
      UploadInvoice: JobStatus.Stop,
      None: JobStatus.Stop,
    },
    jobCode: '',
    jobId: 0,
  });

  return (
    <ActionStatusContext.Provider value={{ actionStatus, setActionStatus }}>{children}</ActionStatusContext.Provider>
  );
};
