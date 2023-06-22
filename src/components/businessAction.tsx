import { Grid } from '@mui/material';
import { messages } from '../util/messages';
import { ActionButton } from './actionButton';
import { useEffect } from 'react';
import {
  checkWritePermission,
  createJobLogFile,
  isExistedFileOrFolder,
  isExitedPath,
  openFile,
  readDir,
  readDirJoinPath,
  setClosable,
} from '../util/electron';
import { useConfig } from '../context/ConfigContext';
import { useModal } from 'mui-modal-provider';
import { ModalDialog } from './modal';
import { SelectDeadline } from './selectDeadline';
import { JobMode, JobStatus, useActionStatus } from '../context/ActionContext';
import { fetchJobExec } from '../api/jobExec';
import { useAuthContext } from '../context/AuthContext';
import { introspectToken, updateToken } from '../api/authorize';
import { EXPIRES_IN } from '../util/constants';
import { fetchJobLogs } from '../api/jobLogs';

const RobotStatus = {
  Processing: 'processing',
  Finished: 'finished',
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type RobotStatus = (typeof RobotStatus)[keyof typeof RobotStatus];

/** ジョブログ監視を継続するステータス */
const StatusToContinueMonitoring = ['accepted', 'processing'] as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
type StatusToContinueMonitoring = (typeof StatusToContinueMonitoring)[number];

export type Props = {
  clientId: string;
  configPath: string;
  onJobRunning: (running: boolean) => void;
};

export const BusinessAction = (props: Props) => {
  /** 実行結果ファイルの監視インターバル(ミリ秒) */
  const delay = 10 * 1000;
  const { clientId, configPath, onJobRunning } = props;
  const { config } = useConfig();
  const authContext = useAuthContext();
  const { showModal } = useModal();
  const { actionStatus, setActionStatus } = useActionStatus();

  useEffect(() => {
    if (actionStatus.status[actionStatus.mode] === JobStatus.Waiting) {
      (async () => {
        await interval(delay, actionStatus.status[actionStatus.mode]);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionStatus]);

  const interval = async (ms: number, status: JobStatus) => {
    let isPolling = true;
    let jobStatus = status;
    let monitoringTimeLimit = null;
    while (isPolling) {
      // 指定時間待機
      await new Promise((resolve) => setTimeout(resolve, ms));

      if (jobStatus === JobStatus.Waiting) {
        let isBreak = false;
        for (let i = 0; i < 30; i++) {
          const status = await checkJobLogStatus();
          if (StatusToContinueMonitoring.some((value) => value === status)) {
            // ロボット処理開始チェック
            const fileNmae = await getFileNameByJobCode();
            if (
              fileNmae.match(new RegExp(RobotStatus.Processing)) ||
              fileNmae.match(new RegExp(RobotStatus.Finished))
            ) {
              isBreak = true;
              break;
            }
          } else {
            // WF(ロボット)の処理が終わっているのでジョブログ監視終了
            break;
          }

          // 既定時間待機後にリトライ
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // 最終チェック
        const fileNmae = await getFileNameByJobCode();
        if (fileNmae.match(new RegExp(RobotStatus.Processing))) {
          setActionStatus({ ...actionStatus, status: statusObj(actionStatus.mode, JobStatus.Running) });
          jobStatus = JobStatus.Running;
          setClosable(false);
          isBreak = true;
        } else if (fileNmae.match(new RegExp(RobotStatus.Finished))) {
          setActionStatus({ ...actionStatus, status: statusObj(actionStatus.mode, JobStatus.Finished) });
          openFile(config.executetionLogFolderPath, fileNmae);
          setClosable(true);
          onJobRunning(false);
          isBreak = true;
          isPolling = false;
          break;
        }

        // WFのジョブが完了しない & 実行結果ファイル未作成のまま であればキャンセルする
        if (!isBreak) {
          setClosable(true);
          onJobRunning(false);
          createCancelLog();
          setActionStatus({
            ...actionStatus,
            status: statusObj(actionStatus.mode, JobStatus.Failed),
          });
          showModal(ModalDialog, { message: getJobFailedMessage(actionStatus.mode), isConfirm: false });
          isPolling = false;
          break;
        }
      } else {
        // actionStatus.status[actionStatus.mode] === JobStatus.Running

        // 監視タイムアウトチェック
        if (monitoringTimeLimit == null) {
          monitoringTimeLimit = new Date().getTime() + 1000 * 60 * Number(config.action.timeout);
        } else if (new Date().getTime() >= monitoringTimeLimit) {
          // 強制終了
          setActionStatus({ ...actionStatus, status: statusObj(actionStatus.mode, JobStatus.Failed) });
          setClosable(true);
          onJobRunning(false);
          showModal(ModalDialog, { message: messages.error.monitoringTimeout, isConfirm: false });
          // clearInterval(interval);
          isPolling = false;
          break;
        }

        // ロボット処理終了チェック
        const fileNmae = await getFileNameByJobCode();
        if (fileNmae.match(new RegExp(RobotStatus.Finished))) {
          setActionStatus({ ...actionStatus, status: statusObj(actionStatus.mode, JobStatus.Finished) });
          openFile(config.executetionLogFolderPath, fileNmae);
          setClosable(true);
          onJobRunning(false);
          isPolling = false;
          break;
        }
      }
    }
  };

  /** ジョブコードを含む実行結果ファイルを取得 */
  const getFileNameByJobCode = async () => {
    const list = await readDir(config.executetionLogFolderPath, false);
    const filteringList = list.filter((fileName: string) => {
      return fileName.match(new RegExp(actionStatus.jobCode)) != null;
    });
    return filteringList.length > 0 ? filteringList[0] : '';
  };

  const checkJobLogStatus = async () => {
    if (authContext.accessToken != null && authContext.refreshToken != null) {
      const token = await checkTokenAvailable(authContext.accessToken, authContext.refreshToken);
      const jobLogs = await fetchJobLogs(token, authContext.isDev, authContext.appInstanceId, actionStatus.jobId);
      return jobLogs ? jobLogs.status : '';
    }
    return '';
  };

  const createCancelLog = async () => {
    const list = await readDir(config.executetionLogFolderPath, false);
    const filteringList = list.filter((fileName: string) => {
      return fileName.match(new RegExp(actionStatus.jobCode)) != null;
    });
    if (filteringList.length === 0) {
      // 実行結果ファイルが未作成なので作成する
      createJobLogFile(config.executetionLogFolderPath, actionStatus.jobCode);
    }
  };

  const statusObj = (mode: JobMode, status: JobStatus) => {
    return {
      UnzipStatement: mode === JobMode.UnzipStatement ? status : actionStatus.status.UnzipStatement,
      SortStatement: mode === JobMode.SortStatement ? status : actionStatus.status.SortStatement,
      SortInvoice: mode === JobMode.SortInvoice ? status : actionStatus.status.SortInvoice,
      MergeInvoice: mode === JobMode.MergeInvoice ? status : actionStatus.status.MergeInvoice,
      UploadInvoice: mode === JobMode.UploadInvoice ? status : actionStatus.status.UploadInvoice,
      None: JobStatus.Stop,
    };
  };

  const getStatus = (mode: JobMode) => {
    let status = messages.main.status.stop;
    switch (actionStatus.status[mode]) {
      case JobStatus.Running:
        status = `${messages.main.status.running} (ジョブコード：${actionStatus.jobCode})`;
        break;
      case JobStatus.Waiting:
        status = messages.main.status.waiting;
        break;
      case JobStatus.Finished:
        status = messages.main.status.finished;
        break;
      case JobStatus.Failed:
        status = messages.main.status.Failed;
        break;
    }
    return status;
  };

  const showModalErrorDialog = (message: string) => {
    showModal(ModalDialog, { message: message, isConfirm: false });
  };

  const selectedDeadline = async (mode: JobMode) => {
    if (!config.robot.processName) {
      showModal(ModalDialog, { message: messages.error.notSetRobotProcess, isConfirm: false });
      return;
    }

    if (config.deadlineFolderPath) {
      const isExist = await isExitedPath(config.deadlineFolderPath);
      if (isExist) {
        const isPermission = await checkWritePermission(config.deadlineFolderPath, false);
        if (isPermission) {
        } else {
          showModalErrorDialog(messages.error.noWritePermission.deadlineFolderPath);
          return;
        }
      } else {
        showModalErrorDialog(messages.error.notSetActionFolder);
        return;
      }
    } else {
      showModalErrorDialog(messages.error.notSetActionFolder);
      return;
    }

    const list = await readDir(config.deadlineFolderPath, true);
    if (list && list.length > 0) {
      const formattedList = list
        .map((folderName: string) => ({
          name: folderName,
          selected: false,
        }))
        .sort();
      showModal(SelectDeadline, {
        folderList: formattedList,
        onClose: (isOk: boolean) => {
          if (isOk) {
            const deadline = formattedList
              .filter((value: { name: string; selected: boolean }) => value.selected)
              .map((value: { name: string; selected: boolean }) => value.name);
            checkParam(mode, deadline);
          }
        },
      });
    } else {
      showModal(ModalDialog, { message: messages.unExisteddeadlineFolder, isConfirm: false });
    }
  };

  const checkPath = async (mode: JobMode) => {
    let checkZip = true;
    let checkStatement = true;
    let checkInvoice = true;
    let checkDeadline = true;
    let checkStandBy = true;
    let checkSentFor = true;
    let checkBackup = true;
    let checkLog = true;

    switch (mode) {
      case JobMode.UnzipStatement:
        checkZip = await isExitedPath(config.statementZipFolderPath);
        checkStatement = await isExitedPath(config.statementFolderPath);
        checkBackup = await isExitedPath(config.backupFolderPath);
        checkLog = await isExitedPath(config.executetionLogFolderPath);
        break;
      case JobMode.SortStatement:
        checkStatement = await isExitedPath(config.statementFolderPath);
        checkDeadline = await isExitedPath(config.deadlineFolderPath);
        checkBackup = await isExitedPath(config.backupFolderPath);
        checkLog = await isExitedPath(config.executetionLogFolderPath);
        break;
      case JobMode.SortInvoice:
        checkInvoice = await isExitedPath(config.invoiceFolderPath);
        checkDeadline = await isExitedPath(config.deadlineFolderPath);
        checkStandBy = await isExitedPath(config.standbyFolderPath);
        checkBackup = await isExitedPath(config.backupFolderPath);
        checkLog = await isExitedPath(config.executetionLogFolderPath);
        break;
      case JobMode.MergeInvoice:
        checkDeadline = await isExitedPath(config.deadlineFolderPath);
        checkStandBy = await isExitedPath(config.standbyFolderPath);
        checkLog = await isExitedPath(config.executetionLogFolderPath);
        break;
      case JobMode.UploadInvoice:
        checkStandBy = await isExitedPath(config.standbyFolderPath);
        checkSentFor = await isExitedPath(config.sentFolderPath);
        checkLog = await isExitedPath(config.executetionLogFolderPath);
        break;
    }
    return new Promise<boolean>((resolve) => {
      Promise.all([
        checkZip,
        checkStatement,
        checkInvoice,
        checkDeadline,
        checkStandBy,
        checkSentFor,
        checkBackup,
        checkLog,
      ]).then((result) => {
        resolve(result.filter((isError) => !isError).length > 0);
      });
    });
  };

  const checkPermission = async (mode: JobMode) => {
    let checkZip = true;
    let checkStatement = true;
    let checkInvoice = true;
    let checkDeadline = true;
    let checkStandBy = true;
    let checkSentFor = true;
    let checkBackup = true;
    let checkLog = true;

    switch (mode) {
      case JobMode.UnzipStatement:
        checkZip = await checkWritePermission(config.statementZipFolderPath, false);
        checkStatement = await checkWritePermission(config.statementFolderPath, false);
        checkBackup = await checkWritePermission(config.backupFolderPath, false);
        checkLog = await checkWritePermission(config.executetionLogFolderPath, false);
        break;
      case JobMode.SortStatement:
        checkStatement = await checkWritePermission(config.statementFolderPath, false);
        checkDeadline = await checkWritePermission(config.deadlineFolderPath, false);
        checkBackup = await checkWritePermission(config.backupFolderPath, false);
        checkLog = await checkWritePermission(config.executetionLogFolderPath, false);
        break;
      case JobMode.SortInvoice:
        checkInvoice = await checkWritePermission(config.invoiceFolderPath, false);
        checkDeadline = await checkWritePermission(config.deadlineFolderPath, false);
        checkStandBy = await checkWritePermission(config.standbyFolderPath, false);
        checkBackup = await checkWritePermission(config.backupFolderPath, false);
        checkLog = await checkWritePermission(config.executetionLogFolderPath, false);
        break;
      case JobMode.MergeInvoice:
        checkDeadline = await checkWritePermission(config.deadlineFolderPath, false);
        checkStandBy = await checkWritePermission(config.standbyFolderPath, false);
        checkLog = await checkWritePermission(config.executetionLogFolderPath, false);
        break;
      case JobMode.UploadInvoice:
        checkStandBy = await checkWritePermission(config.standbyFolderPath, false);
        checkSentFor = await checkWritePermission(config.sentFolderPath, false);
        checkLog = await checkWritePermission(config.executetionLogFolderPath, false);
        break;
    }
    return new Promise<{ isError: boolean; message: string }>((resolve) => {
      Promise.all([
        checkZip,
        checkStatement,
        checkInvoice,
        checkDeadline,
        checkStandBy,
        checkSentFor,
        checkBackup,
        checkLog,
      ]).then((result) => {
        let message = '';
        if (!checkZip) {
          message = messages.error.noWritePermission.statementZipFolder;
        } else if (!checkStatement) {
          message = messages.error.noWritePermission.statementFolderPath;
        } else if (!checkInvoice) {
          message = messages.error.noWritePermission.invoiceFolderPath;
        } else if (!checkDeadline) {
          message = messages.error.noWritePermission.deadlineFolderPath;
        } else if (!checkStandBy) {
          message = messages.error.noWritePermission.standbyFolderPath;
        } else if (!checkSentFor) {
          message = messages.error.noWritePermission.sentFolderPath;
        } else if (!checkBackup) {
          message = messages.error.noWritePermission.backupFolderPath;
        } else if (!checkLog) {
          message = messages.error.noWritePermission.executetionLogFolderPath;
        }

        resolve({
          isError: result.filter((isError) => !isError).length > 0,
          message: message,
        });
      });
    });
  };

  const checkParam = (mode: JobMode, deadline: string[] = new Array<string>()) => {
    new Promise<boolean>((resolve) => {
      if (!config.robot.processName && mode !== JobMode.MergeInvoice) {
        showModal(ModalDialog, { message: messages.error.notSetRobotProcess, isConfirm: false });
        resolve(false);
        return;
      }

      // 実行関連フォルダパスの設定有無&存在チェック
      checkPath(mode).then((isError: boolean) => {
        if (isError) {
          showModal(ModalDialog, { message: messages.error.notSetActionFolder, isConfirm: false });
          resolve(false);
          return;
        }

        // 書き込み権限チェック
        checkPermission(mode).then((result: { isError: boolean; message: string }) => {
          if (result.isError) {
            showModalErrorDialog(result.message);
            resolve(false);
            return;
          }

          if (mode === JobMode.UnzipStatement) {
            // ZIP解凍先フォルダが空かチェック
            isExistedFileOrFolder(config.statementFolderPath).then((isExisted: boolean) => {
              if (isExisted) {
                showModal(ModalDialog, {
                  message: messages.error.fileExistedIntoStatementZipFolder,
                  isConfirm: false,
                });
                resolve(false);
                return;
              } else {
                resolve(true);
              }
            });
          } else if (mode === JobMode.UploadInvoice) {
            // MakeLeapsの認証情報が設定されていることを確認
            if (!(config.account.id && config.account.password && config.certifiedCompanyName)) {
              showModal(ModalDialog, { message: messages.error.notSetAccountInfo, isConfirm: false });
              resolve(false);
              return;
            } else {
              resolve(true);
            }
          } else {
            resolve(true);
          }
        });
      });
    }).then(async (value) => {
      if (!value) {
        return;
      }

      let modalMsg = '';
      let targetPath = '';
      if (mode === JobMode.MergeInvoice) {
        if (deadline?.length > 0) {
          let fileCount = 0;
          for (let i = 0; i < deadline.length; i++) {
            const list = await readDirJoinPath(config.deadlineFolderPath, deadline[i]);
            if (list) {
              fileCount += list?.length;
            }
          }
          if (fileCount > 0) {
            showModal(ModalDialog, {
              message: `${messages.advanced.target.MergeInvoice}は${fileCount}件です。`,
              secondMessage: messages.closeMaster,
              isConfirm: true,
              onClose: (isOk: boolean) => callbackConfirm(isOk, mode, deadline.join()),
            });
          } else {
            showModal(ModalDialog, {
              message: `${messages.advanced.target.MergeInvoice}がありません。`,
              isConfirm: false,
            });
          }
        }
      } else {
        switch (mode) {
          case JobMode.UnzipStatement:
            modalMsg = messages.advanced.target.UnzipStatement;
            targetPath = config.statementZipFolderPath;
            break;
          case JobMode.SortStatement:
            modalMsg = messages.advanced.target.SortStatement;
            targetPath = config.statementFolderPath;
            break;
          case JobMode.SortInvoice:
            modalMsg = messages.advanced.target.SortInvoice;
            targetPath = config.invoiceFolderPath;
            break;
          case JobMode.UploadInvoice:
            modalMsg = messages.advanced.target.UploadInvoice;
            targetPath = config.standbyFolderPath;
            break;
        }
        readDir(targetPath, false).then((fileList: string[]) => {
          if (fileList.length > 0) {
            modalMsg += `は${fileList.length}件です`;
            showModal(ModalDialog, {
              message: modalMsg,
              secondMessage: messages.closeMaster,
              isConfirm: true,
              onClose: (isOk: boolean) => callbackConfirm(isOk, mode),
            });
          } else {
            modalMsg += `がありません`;
            showModal(ModalDialog, { message: modalMsg, isConfirm: false });
          }
        });
      }
    });
  };

  const callbackConfirm = async (isOk: boolean, mode: JobMode, deadline: string = '') => {
    if (isOk) {
      if (authContext.accessToken != null && authContext.refreshToken != null) {
        jobExec(authContext.accessToken, authContext.refreshToken, mode, deadline);
      }
    }
  };

  /** アクセストークンの有効期限検証 */
  const checkTokenAvailable = (accessToken: string, refreshToken: string) => {
    return new Promise<string>(async (resolve) => {
      const isActiveAccessToken = await introspectToken(authContext.isDev, accessToken, clientId);
      if (!isActiveAccessToken) {
        const response = await updateToken(authContext.isDev, refreshToken, clientId, EXPIRES_IN);
        if (response) {
          resolve(response.access_token);
        }
      } else {
        resolve(accessToken);
      }
    });
  };

  const jobExec = async (accessToken: string, refreshToken: string, mode: JobMode, deadline: string) => {
    checkTokenAvailable(accessToken, refreshToken).then(async (token: string) => {
      const result = await fetchJobExec({
        token: token,
        isDev: authContext.isDev,
        appInstanceId: authContext.appInstanceId,
        serviceClass: authContext.serviceClass,
        settingsUrl: configPath,
        mode: mode,
        deadline: deadline,
        makeLeapsId: config.account.id,
        makeLeapsPasswod: config.account.password,
        robotProcess: config.robot.processName,
      });
      if (result) {
        if (result.ok) {
          setActionStatus({
            mode: mode,
            status: statusObj(mode, JobStatus.Waiting),
            jobCode: result.jobCode,
            jobId: result.jobId,
          });
          onJobRunning(true);
        } else {
          setActionStatus({
            ...actionStatus,
            mode: mode,
            status: statusObj(mode, JobStatus.Failed),
          });
          showModal(ModalDialog, { message: getJobFailedMessage(mode), isConfirm: false });
        }
      }
    });
  };

  const getJobFailedMessage = (mode: JobMode) => {
    let msg = '';
    switch (mode) {
      case JobMode.UnzipStatement:
        msg = messages.error.jobFailed.UnzipStatement;
        break;
      case JobMode.SortStatement:
        msg = messages.error.jobFailed.SortStatement;
        break;
      case JobMode.SortInvoice:
        msg = messages.error.jobFailed.SortInvoice;
        break;
      case JobMode.MergeInvoice:
        msg = messages.error.jobFailed.MergeInvoice;
        break;
      case JobMode.UploadInvoice:
        msg = messages.error.jobFailed.UploadInvoice;
        break;
    }
    return msg;
  };

  const disabled =
    actionStatus.status[actionStatus.mode] === JobStatus.Waiting ||
    actionStatus.status[actionStatus.mode] === JobStatus.Running;

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ActionButton
            onClick={() => checkParam(JobMode.UnzipStatement)}
            disabled={disabled}
            status={getStatus(JobMode.UnzipStatement)}
            label={messages.main.action.UnzipStatement}
          />
        </Grid>
        <Grid item xs={12}>
          <ActionButton
            onClick={() => checkParam(JobMode.SortStatement)}
            disabled={disabled}
            status={getStatus(JobMode.SortStatement)}
            label={messages.main.action.SortStatement}
          />
        </Grid>
        <Grid item xs={12}>
          <ActionButton
            onClick={() => checkParam(JobMode.SortInvoice)}
            disabled={disabled}
            status={getStatus(JobMode.SortInvoice)}
            label={messages.main.action.SortInvoice}
          />
        </Grid>
        <Grid item xs={12}>
          <ActionButton
            onClick={() => selectedDeadline(JobMode.MergeInvoice)}
            disabled={disabled}
            status={getStatus(JobMode.MergeInvoice)}
            label={messages.main.action.MergeInvoice}
          />
        </Grid>
        <Grid item xs={12}>
          <ActionButton
            onClick={() => checkParam(JobMode.UploadInvoice)}
            disabled={disabled}
            status={getStatus(JobMode.UploadInvoice)}
            label={messages.main.action.UploadInvoice}
          />
        </Grid>
      </Grid>
    </>
  );
};
