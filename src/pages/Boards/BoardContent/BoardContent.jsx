import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'

function BoardContent({ board }) {
  const orderedColumns = mapOrder(board?.columns, board?.columnOrderIds, '_id')

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
      <ListColumns columns={orderedColumns} />
    </Box>
  )
}

export default BoardContent