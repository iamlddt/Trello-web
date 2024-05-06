import Box from '@mui/material/Box'
import ModeSelect from '~/components/ModeSelect'

function AppBar() {
  return (
    <Box
      sx={{
        width: '100%',
        height: (theme) => theme.trelloCustom.appBarHeight,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'primary.light'
      }}
    >
      <ModeSelect />
    </Box>
  )
}

export default AppBar
