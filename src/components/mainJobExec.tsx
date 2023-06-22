import { Box, Button, Card, styled } from '@mui/material';
import { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLogOut } from '../api/logout';
import { useAuthContext } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { getSettingsPath, openFile } from '../util/electron';
import { messages } from '../util/messages';
import { BusinessAction } from './businessAction';
import { useModal } from 'mui-modal-provider';
import { ModalDialog } from './modal';

export const MainJobExec = memo(() => {
  const navigation = useNavigate();
  const authContext = useAuthContext();
  const { config } = useConfig();
  const { showModal } = useModal();
  const [configPath, setConfigPath] = useState('');
  const [jobRunning, setJobRunning] = useState(false);

  useEffect(() => {
    const setPath = async () => {
      const path = await getSettingsPath();
      if (path) {
        setConfigPath(path);
      }
    };
    setPath();
  }, []);

  const masterOpen = useCallback(() => {
    if (config.masterFilePath) {
      openFile(config.masterFilePath);
    } else {
      showModal(ModalDialog, { message: messages.error.notSetMaster, isConfirm: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.masterFilePath]);

  return (
    <>
      <CardBox sx={{ marginTop: '20px' }}>
        <BoxContent>
          <ExecButton
            variant="contained"
            color="secondary"
            sx={{ margin: '0px' }}
            disabled={jobRunning}
            onClick={masterOpen}
          >
            {messages.main.action.editMaster}
          </ExecButton>
        </BoxContent>
      </CardBox>
      <CardBox>
        <BoxContent>
          <BusinessAction clientId={authContext.clientId} configPath={configPath} onJobRunning={setJobRunning} />
        </BoxContent>
      </CardBox>
      <CardBox>
        <BoxContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" disabled={jobRunning} onClick={() => navigation('/settings')}>
            {messages.main.setting}
          </Button>
          <Button
            variant="contained"
            disabled={jobRunning}
            onClick={() => fetchLogOut(authContext.isDev, authContext.accessToken)}
          >
            {messages.main.logout}
          </Button>
        </BoxContent>
      </CardBox>
    </>
  );
});

const CardBox = styled(Card)(() => ({
  marginBottom: 20,
  marginLeft: 20,
  marginRight: 20,
}));

const BoxContent = styled(Box)(() => ({
  flexGrow: 1,
  margin: '20px 20px',
}));

const ExecButton = styled(Button)(() => ({
  width: '100%',
  marginBottom: '10px',
  textTransform: 'none',
}));
