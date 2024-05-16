import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'

function BoardContent() {
  return (
    <Box
      sx={{
        p: '10px 0',
        width: '100%',
        height: (theme) => theme.trelloCustom.boardContentHeight,
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? '#344495e' : '#1976d2'
      }}
    >
      <ListColumns />
    </Box>
  )
}

export default BoardContent
