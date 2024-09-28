import { MethodType } from '@interfaces/MethodType.ts'
import { styled } from '@mui/material/styles';
import { Box, FormControl, Button, Select, MenuItem, InputLabel } from '@mui/material'

interface Props {
  isSocketConnect: Boolean,
  startSocket: () => void,
  methodTypeValueProps: {
    methodTypeValue: string,
    setMethodTypeValue: (value: string) => void
  },
  methodTypeList: { [key: string]: MethodType },
  handleImage: (event: React.ChangeEvent<HTMLInputElement>) => void
}

function ControlSection(props: Props) {
  const { isSocketConnect, startSocket, methodTypeValueProps, methodTypeList, handleImage } = props
  const { methodTypeValue, setMethodTypeValue } = methodTypeValueProps

  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <Button variant='contained'
        sx={{ backgroundColor: isSocketConnect ? 'red' : 'green', transitionDuration: '0s' }}
        disableRipple={true}
        onClick={startSocket}>
        {isSocketConnect ? 'disconnect' : 'connect'}
      </Button>

      <FormControl sx={{ display: (isSocketConnect) ? 'block' : 'none' }}>
        <InputLabel id="select-label-method">Method</InputLabel>
        <Select
          labelId='select-label-method'
          value={methodTypeValue}
          label="Method"
          sx={{ padding: '0 30px', height: '40px' }}
          onChange={(e) => { setMethodTypeValue(e.target.value) }}
        >
          {
            Object.keys(methodTypeList).map((key) => {
              return (
                <MenuItem key={key} value={methodTypeList[key].value}>
                  {methodTypeList[key].name}
                </MenuItem>
              )
            })
          }
        </Select>
      </FormControl>

      <Button
        sx={{ display: (isSocketConnect) ? 'block' : 'none' }}
        component="label"
        role={undefined}
        variant="contained"
        tabIndex={-1}
      >
        上傳圖片
        <VisuallyHiddenInput
          type="file"
          onChange={handleImage}
          accept="image/*"
        />
      </Button>
    </Box >
  );
}

export default ControlSection;