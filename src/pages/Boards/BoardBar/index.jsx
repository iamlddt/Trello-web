import Box from '@mui/material/Box'

function BoardBar() {
  return (
    <Box
      sx={{
        width: '100%',
        height: (theme) => theme.trelloCustom.boardBarHeight,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'primary.dark'
      }}
    >
      Board Bar
    </Box>
  )
}

export default BoardBar