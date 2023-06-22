import { Alert, Box, Button, Card, Grid, Snackbar, Typography, styled } from '@mui/material';
import { SettingsItem } from './settingsItem';
import { messages } from '../util/messages';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { checkWritePermission, isExitedPath } from '../util/electron';
import { useEffect, useState } from 'react';

export const Settings = () => {
  const maxLen = 100;
  const navigation = useNavigate();
  const { config, setConfig, saveConfig } = useConfig();
  const [open, setOpen] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [isError, setIsError] = useState({
    masterFilePath: false,
    statementZipFolderPath: false,
    statementFolderPath: false,
    invoiceFolderPath: false,
    deadlineFolderPath: false,
    standbyFolderPath: false,
    sentFolderPath: false,
    backupFolderPath: false,
    executetionLogFolderPath: false,
    makeLeapsId: false,
    makeLeapsPassword: false,
    makeLeapsCompany: false,
    robotProcess: false,
  });
  const [tmpConfig, setTmpConfig] = useState(config);
  const [helperText, setHelperText] = useState({
    masterFilePath: { error: false, helperText: '' },
    statementZipFolderPath: { error: false, helperText: '' },
    statementFolderPath: { error: false, helperText: '' },
    invoiceFolderPath: { error: false, helperText: '' },
    deadlineFolderPath: { error: false, helperText: '' },
    standbyFolderPath: { error: false, helperText: '' },
    sentFolderPath: { error: false, helperText: '' },
    backupFolderPath: { error: false, helperText: '' },
    executetionLogFolderPath: { error: false, helperText: '' },
    makeLeapsId: { error: false, helperText: '' },
    makeLeapsPassword: { error: false, helperText: '' },
    makeLeapsCompany: { error: false, helperText: '' },
    robotProcess: { error: false, helperText: '' },
  });

  useEffect(() => {
    const tmpHelper = {
      masterFilePath: isValidation(config.masterFilePath, true),
      statementZipFolderPath: isValidation(config.statementZipFolderPath, true),
      statementFolderPath: isValidation(config.statementFolderPath, true),
      invoiceFolderPath: isValidation(config.invoiceFolderPath, true),
      deadlineFolderPath: isValidation(config.deadlineFolderPath, true),
      standbyFolderPath: isValidation(config.standbyFolderPath, true),
      sentFolderPath: isValidation(config.sentFolderPath, true),
      backupFolderPath: isValidation(config.backupFolderPath, true),
      executetionLogFolderPath: isValidation(config.executetionLogFolderPath, true),
      makeLeapsId: isValidation(config.account.id, false),
      makeLeapsPassword: isValidation(config.account.password, false),
      makeLeapsCompany: isValidation(config.certifiedCompanyName, false),
      robotProcess: isValidation(config.robot.processName, false),
    };
    setHelperText(tmpHelper);
    setIsError({
      masterFilePath: tmpHelper.masterFilePath.error,
      statementZipFolderPath: tmpHelper.statementZipFolderPath.error,
      statementFolderPath: tmpHelper.statementFolderPath.error,
      invoiceFolderPath: tmpHelper.invoiceFolderPath.error,
      deadlineFolderPath: tmpHelper.deadlineFolderPath.error,
      standbyFolderPath: tmpHelper.standbyFolderPath.error,
      sentFolderPath: tmpHelper.sentFolderPath.error,
      backupFolderPath: tmpHelper.backupFolderPath.error,
      executetionLogFolderPath: tmpHelper.executetionLogFolderPath.error,
      makeLeapsId: tmpHelper.makeLeapsId.error,
      makeLeapsPassword: tmpHelper.makeLeapsPassword.error,
      makeLeapsCompany: tmpHelper.makeLeapsCompany.error,
      robotProcess: tmpHelper.robotProcess.error,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isValidation = (value: string, isPath: boolean) => {
    if (value.length === 0) {
      return { error: true, helperText: messages.settings.error.notEntered };
    } else if (isPath && value.length > maxLen) {
      return { error: true, helperText: messages.settings.error.tooLongPath };
    } else {
      return { error: false, helperText: '' };
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleErrorOpen = () => {
    setOpenError(true);
  };
  const handleErrorClose = () => {
    setOpenError(false);
  };

  const onSave = async () => {
    const tmpHelper = {
      masterFilePath: { helperText: '', error: false },
      statementZipFolderPath: { helperText: '', error: false },
      statementFolderPath: { helperText: '', error: false },
      invoiceFolderPath: { helperText: '', error: false },
      deadlineFolderPath: { helperText: '', error: false },
      standbyFolderPath: { helperText: '', error: false },
      sentFolderPath: { helperText: '', error: false },
      backupFolderPath: { helperText: '', error: false },
      executetionLogFolderPath: { helperText: '', error: false },
      makeLeapsId: { helperText: '', error: false },
      makeLeapsPassword: { helperText: '', error: false },
      makeLeapsCompany: { helperText: '', error: false },
      robotProcess: { helperText: '', error: false },
    };

    const errorMsg = messages.settings.error.access;
    const errorMsgPathNotExisted = messages.settings.error.notExistPath;

    const existedMaster = await isExitedPath(tmpConfig.masterFilePath);
    const existedZip = await isExitedPath(tmpConfig.statementZipFolderPath);
    const existedStatement = await isExitedPath(tmpConfig.statementFolderPath);
    const existedInvoice = await isExitedPath(tmpConfig.invoiceFolderPath);
    const existedDeadline = await isExitedPath(tmpConfig.deadlineFolderPath);
    const existedStandBy = await isExitedPath(tmpConfig.standbyFolderPath);
    const existedSent = await isExitedPath(tmpConfig.sentFolderPath);
    const existedBackup = await isExitedPath(tmpConfig.backupFolderPath);
    const existedLog = await isExitedPath(tmpConfig.executetionLogFolderPath);

    let permisisonMaster = true;
    let permissionZip = true;
    let permissionStatement = true;
    let permissionInvoice = true;
    let permissionDeadline = true;
    let permissionStandBy = true;
    let permissionSent = true;
    let permissionBackup = true;
    let permissionLog = true;

    Promise.all([
      existedMaster,
      existedZip,
      existedStatement,
      existedInvoice,
      existedDeadline,
      existedStandBy,
      existedSent,
      existedBackup,
      existedLog,
    ]).then(async (result) => {
      if (!result[0]) {
        tmpHelper.masterFilePath = { helperText: errorMsgPathNotExisted, error: true };
      } else {
        permisisonMaster = await checkWritePermission(tmpConfig.masterFilePath, true);
      }
      if (!result[1]) {
        tmpHelper.statementZipFolderPath = { helperText: errorMsgPathNotExisted, error: true };
      } else {
        permissionZip = await checkWritePermission(tmpConfig.statementZipFolderPath, false);
      }
      if (!result[2]) {
        tmpHelper.statementFolderPath = { helperText: errorMsgPathNotExisted, error: true };
      } else {
        permissionStatement = await checkWritePermission(tmpConfig.statementFolderPath, false);
      }
      if (!result[3]) {
        tmpHelper.invoiceFolderPath = { helperText: errorMsgPathNotExisted, error: true };
      } else {
        permissionInvoice = await checkWritePermission(tmpConfig.invoiceFolderPath, false);
      }
      if (!result[4]) {
        tmpHelper.deadlineFolderPath = { helperText: errorMsgPathNotExisted, error: true };
      } else {
        permissionDeadline = await checkWritePermission(tmpConfig.deadlineFolderPath, false);
      }
      if (!result[5]) {
        tmpHelper.standbyFolderPath = { helperText: errorMsgPathNotExisted, error: true };
      } else {
        permissionStandBy = await checkWritePermission(tmpConfig.standbyFolderPath, false);
      }
      if (!result[6]) {
        tmpHelper.sentFolderPath = { helperText: errorMsgPathNotExisted, error: true };
      } else {
        permissionSent = await checkWritePermission(tmpConfig.sentFolderPath, false);
      }
      if (!result[7]) {
        tmpHelper.backupFolderPath = { helperText: errorMsgPathNotExisted, error: true };
      } else {
        permissionBackup = await checkWritePermission(tmpConfig.backupFolderPath, false);
      }
      if (!result[8]) {
        tmpHelper.executetionLogFolderPath = { helperText: errorMsgPathNotExisted, error: true };
      } else {
        permissionLog = await checkWritePermission(tmpConfig.executetionLogFolderPath, false);
      }

      Promise.all([
        permisisonMaster,
        permissionZip,
        permissionStatement,
        permissionInvoice,
        permissionDeadline,
        permissionStandBy,
        permissionSent,
        permissionBackup,
        permissionLog,
      ]).then((permissionResult) => {
        if (!permissionResult[0]) {
          tmpHelper.masterFilePath = { helperText: errorMsg, error: true };
        }
        if (!permissionResult[1]) {
          tmpHelper.statementZipFolderPath = { helperText: errorMsg, error: true };
        }
        if (!permissionResult[2]) {
          tmpHelper.statementFolderPath = { helperText: errorMsg, error: true };
        }
        if (!permissionResult[3]) {
          tmpHelper.invoiceFolderPath = { helperText: errorMsg, error: true };
        }
        if (!permissionResult[4]) {
          tmpHelper.deadlineFolderPath = { helperText: errorMsg, error: true };
        }
        if (!permissionResult[5]) {
          tmpHelper.standbyFolderPath = { helperText: errorMsg, error: true };
        }
        if (!permissionResult[6]) {
          tmpHelper.sentFolderPath = { helperText: errorMsg, error: true };
        }
        if (!permissionResult[7]) {
          tmpHelper.backupFolderPath = { helperText: errorMsg, error: true };
        }
        if (!permissionResult[8]) {
          tmpHelper.executetionLogFolderPath = { helperText: errorMsg, error: true };
        }
        setHelperText(tmpHelper);

        if (
          result.filter((value) => value).length === result.length &&
          permissionResult.filter((value) => value).length === permissionResult.length
        ) {
          setConfig(tmpConfig);
          saveConfig(tmpConfig);
          handleOpen();
        } else {
          handleErrorOpen();
        }
      });
    });
  };

  return (
    <>
      <CardBox>
        <BoxContent>
          <Typography variant="h6" gutterBottom={false} sx={{ marginBottom: '10px' }}>
            {messages.settings.section.master}
          </Typography>
          <Grid container spacing={2} sx={{ justifyContent: 'space-between' }}>
            <SettingsItem
              label={messages.settings.path.masterFilePath}
              value={tmpConfig.masterFilePath}
              isPath
              isFile
              helper={helperText.masterFilePath}
              onChange={(value) => {
                setTmpConfig({ ...tmpConfig, masterFilePath: value });
                const valid = isValidation(value, true);
                setHelperText({ ...helperText, masterFilePath: valid });
                setIsError({ ...isError, masterFilePath: valid.error });
              }}
            />
          </Grid>
        </BoxContent>
      </CardBox>
      <CardBox>
        <BoxContent>
          <Typography variant="h6" gutterBottom={false} sx={{ marginBottom: '10px' }}>
            {messages.settings.section.executionFolder}
          </Typography>
          <Grid container spacing={2} sx={{ justifyContent: 'space-between' }}>
            <SettingsItem
              label={messages.settings.path.statementZipFolderPath}
              value={tmpConfig.statementZipFolderPath}
              isPath
              helper={helperText.statementZipFolderPath}
              onChange={(value) => {
                setTmpConfig({
                  ...tmpConfig,
                  statementZipFolderPath: value,
                });
                const valid = isValidation(value, true);
                setHelperText({ ...helperText, statementZipFolderPath: valid });
                setIsError({ ...isError, statementZipFolderPath: valid.error });
              }}
            />
            <SettingsItem
              label={messages.settings.path.statementFolderPath}
              value={tmpConfig.statementFolderPath}
              isPath
              helper={helperText.statementFolderPath}
              onChange={(value) => {
                setTmpConfig({ ...tmpConfig, statementFolderPath: value });
                const valid = isValidation(value, true);
                setHelperText({ ...helperText, statementFolderPath: valid });
                setIsError({ ...isError, statementFolderPath: valid.error });
              }}
            />
            <SettingsItem
              label={messages.settings.path.invoiceFolderPath}
              value={tmpConfig.invoiceFolderPath}
              isPath
              helper={helperText.invoiceFolderPath}
              onChange={(value) => {
                setTmpConfig({ ...tmpConfig, invoiceFolderPath: value });
                const valid = isValidation(value, true);
                setHelperText({ ...helperText, invoiceFolderPath: valid });
                setIsError({ ...isError, invoiceFolderPath: valid.error });
              }}
            />
            <SettingsItem
              label={messages.settings.path.deadlineFolderPath}
              value={tmpConfig.deadlineFolderPath}
              isPath
              helper={helperText.deadlineFolderPath}
              onChange={(value) => {
                setTmpConfig({ ...tmpConfig, deadlineFolderPath: value });
                const valid = isValidation(value, true);
                setHelperText({ ...helperText, deadlineFolderPath: valid });
                setIsError({ ...isError, deadlineFolderPath: valid.error });
              }}
            />
            <SettingsItem
              label={messages.settings.path.standbyFolderPath}
              value={tmpConfig.standbyFolderPath}
              isPath
              helper={helperText.standbyFolderPath}
              onChange={(value) => {
                setTmpConfig({ ...tmpConfig, standbyFolderPath: value });
                const valid = isValidation(value, true);
                setHelperText({ ...helperText, standbyFolderPath: valid });
                setIsError({ ...isError, standbyFolderPath: valid.error });
              }}
            />
            <SettingsItem
              label={messages.settings.path.sentFolderPath}
              value={tmpConfig.sentFolderPath}
              isPath
              helper={helperText.sentFolderPath}
              onChange={(value) => {
                setTmpConfig({ ...tmpConfig, sentFolderPath: value });
                const valid = isValidation(value, true);
                setHelperText({ ...helperText, sentFolderPath: valid });
                setIsError({ ...isError, sentFolderPath: valid.error });
              }}
            />
            <SettingsItem
              label={messages.settings.path.backupFolderPath}
              value={tmpConfig.backupFolderPath}
              isPath
              helper={helperText.backupFolderPath}
              onChange={(value) => {
                setTmpConfig({ ...tmpConfig, backupFolderPath: value });
                const valid = isValidation(value, true);
                setHelperText({ ...helperText, backupFolderPath: valid });
                setIsError({ ...isError, backupFolderPath: valid.error });
              }}
            />
            <SettingsItem
              label={messages.settings.path.executetionLogFolderPath}
              value={tmpConfig.executetionLogFolderPath}
              isPath
              helper={helperText.executetionLogFolderPath}
              onChange={(value) => {
                setTmpConfig({
                  ...tmpConfig,
                  executetionLogFolderPath: value,
                });
                const valid = isValidation(value, true);
                setHelperText({ ...helperText, executetionLogFolderPath: valid });
                setIsError({ ...isError, executetionLogFolderPath: valid.error });
              }}
            />
          </Grid>
        </BoxContent>
      </CardBox>
      <CardBox>
        <BoxContent>
          <Typography variant="h6" gutterBottom={false} sx={{ marginBottom: '10px' }}>
            {messages.settings.section.makeLeaps}
          </Typography>
          <Grid container spacing={2} sx={{ justifyContent: 'space-between' }}>
            <SettingsItem
              label={messages.settings.makeLeaps.id}
              value={tmpConfig.account.id}
              helper={helperText.makeLeapsId}
              onChange={(value) => {
                setTmpConfig({
                  ...tmpConfig,
                  account: {
                    ...tmpConfig.account,
                    id: value,
                  },
                });
                const valid = isValidation(value, false);
                setHelperText({ ...helperText, makeLeapsId: valid });
                setIsError({ ...isError, makeLeapsId: valid.error });
              }}
            />
            <SettingsItem
              label={messages.settings.makeLeaps.password}
              value={tmpConfig.account.password}
              isPassword
              helper={helperText.makeLeapsPassword}
              onChange={(value) => {
                setTmpConfig({
                  ...tmpConfig,
                  account: {
                    ...tmpConfig.account,
                    password: value,
                  },
                });
                const valid = isValidation(value, false);
                setHelperText({ ...helperText, makeLeapsPassword: valid });
                setIsError({ ...isError, makeLeapsPassword: valid.error });
              }}
            />
            <SettingsItem
              label={messages.settings.makeLeaps.certifiedCompany}
              value={tmpConfig.certifiedCompanyName}
              helper={helperText.makeLeapsCompany}
              onChange={(value) => {
                setTmpConfig({
                  ...tmpConfig,
                  certifiedCompanyName: value,
                });
                const valid = isValidation(value, false);
                setHelperText({ ...helperText, makeLeapsCompany: valid });
                setIsError({ ...isError, makeLeapsCompany: valid.error });
              }}
            />
          </Grid>
        </BoxContent>
      </CardBox>
      <CardBox>
        <BoxContent>
          <Typography variant="h6" gutterBottom={false} sx={{ marginBottom: '10px' }}>
            {messages.settings.section.robot}
          </Typography>
          <Grid container spacing={2} sx={{ justifyContent: 'space-between' }}>
            <SettingsItem
              label={messages.settings.robot.processName}
              value={tmpConfig.robot.processName}
              helper={helperText.robotProcess}
              onChange={(value) => {
                setTmpConfig({
                  ...tmpConfig,
                  robot: { processName: value },
                });
                const valid = isValidation(value, false);
                setHelperText({ ...helperText, robotProcess: valid });
                setIsError({ ...isError, robotProcess: valid.error });
              }}
            />
          </Grid>
        </BoxContent>
      </CardBox>
      <CardBox>
        <BoxContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" onClick={() => navigation('/')}>
            {messages.settings.back}
          </Button>
          <Button
            variant="contained"
            disabled={Object.values(isError).filter((value) => value).length > 0}
            onClick={() => {
              onSave();
            }}
          >
            {messages.settings.save}
          </Button>
        </BoxContent>
      </CardBox>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={open}
        onClose={handleClose}
        autoHideDuration={3000}
      >
        <Alert severity="success">{messages.settings.saveEnd}</Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={openError}
        onClose={handleErrorClose}
        autoHideDuration={3000}
      >
        <Alert severity="error">{messages.settings.saveFailed}</Alert>
      </Snackbar>
    </>
  );
};

const CardBox = styled(Card)(() => ({
  marginBottom: 20,
  marginLeft: 20,
  marginRight: 20,
  marginTop: 20,
}));

const BoxContent = styled(Box)(() => ({
  flexGrow: 1,
  margin: '20px 20px',
}));
