import { HashRouter, Route, Routes } from 'react-router-dom';
import { MainJobExec } from './components/mainJobExec';
import { Settings } from './components/settings';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { ActionStatusProvider } from './context/ActionContext';
import ModalProvider from 'mui-modal-provider';

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <ConfigProvider>
          <ActionStatusProvider>
            <ModalProvider>
              <Routes>
                <Route path="/" element={<MainJobExec />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </ModalProvider>
          </ActionStatusProvider>
        </ConfigProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
