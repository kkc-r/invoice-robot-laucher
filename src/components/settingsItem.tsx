import { Grid, IconButton, InputAdornment, Paper, styled, TextField } from '@mui/material';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { memo, useState } from 'react';
import { fileSelect, folderSelect } from '../util/electron';

type Props = {
  label: string;
  value: string;
  isPath?: boolean;
  isFile?: boolean;
  isPassword?: boolean;
  helper: { helperText: string; error: boolean };
  maxLen?: number;
  onChange: (value: string) => void;
};

export const SettingsItem = memo((props: Props) => {
  const { label, value, isPath = false, isFile = false, isPassword = false, helper, maxLen = 100, onChange } = props;
  const [showPassword, setShowPassword] = useState<Boolean>(false);

  return (
    <Grid item xs={12}>
      <Item>
        {isPath || isPassword ? (
          <TextField
            variant="outlined"
            label={label}
            style={{ width: '100%' }}
            type={isPassword && !showPassword ? 'password' : 'text'}
            value={value || ''}
            error={helper.error}
            helperText={helper.helperText}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            inputProps={
              isPath
                ? {
                    maxLength: maxLen,
                    readOnly: true,
                  }
                : {}
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {isPassword ? (
                    <IconButton edge="end" onClick={() => setShowPassword((show) => !show)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ) : (
                    <IconButton
                      onClick={async () => {
                        if (isFile) {
                          const file = await fileSelect();
                          if (file && file.length > 0) {
                            onChange(file[0]);
                          }
                        } else {
                          const list = await folderSelect();
                          if (list && list.length > 0) {
                            onChange(list[0]);
                          }
                        }
                      }}
                    >
                      <FolderOpenOutlinedIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
        ) : (
          <TextField
            variant="outlined"
            label={label}
            style={{ width: '100%' }}
            value={value || ''}
            error={helper.error}
            helperText={helper.helperText}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </Item>
    </Grid>
  );
});

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  color: theme.palette.text.secondary,
  display: 'flex',
  flexDirection: 'row',
}));
