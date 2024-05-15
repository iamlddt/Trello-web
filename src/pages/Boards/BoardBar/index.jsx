import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import DashboardIcon from '@mui/icons-material/Dashboard'
import VpnLockIcon from '@mui/icons-material/VpnLock'
import AddToDriveIcon from '@mui/icons-material/AddToDrive'
import BoltIcon from '@mui/icons-material/Bolt'
import FilterListIcon from '@mui/icons-material/FilterList'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Tooltip from '@mui/material/Tooltip'
import Image from '~/assets/Khue.jpg'
import Button from '@mui/material/Button'
import PersonAddIcon from '@mui/icons-material/PersonAdd'

function BoardBar() {
  const Menu_Style = {
    color: 'white',
    bgcolor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    padding: 1,
    '& .MuiSvgIcon-root': {
      color: 'white'
    },
    '&:hover': {
      bgcolor: 'primary.50'
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: (theme) => theme.trelloCustom.boardBarHeight,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        overflowX: 'auto',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? '#344495e' : '#1976d2',
        borderBottom: '1px solid white'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          sx={Menu_Style}
          icon={<DashboardIcon />}
          label="TrungDev"
          clickable
        />
        <Chip
          sx={Menu_Style}
          icon={<VpnLockIcon />}
          label="Public/Private Workspace"
          clickable
        />
        <Chip
          sx={Menu_Style}
          icon={<AddToDriveIcon />}
          label="Add To Google Drive"
          clickable
        />
        <Chip
          sx={Menu_Style}
          icon={<BoltIcon />}
          label="Automation"
          clickable
        />
        <Chip
          sx={Menu_Style}
          icon={<FilterListIcon />}
          label="Filters"
          clickable
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          sx={{
            color: 'white',
            borderColor: 'white',
            '&:hover': { borderColor: 'white' }
          }}
        >
          Invite
        </Button>
        <AvatarGroup
          max={3}
          sx={{
            gap: '10px',
            '& .MuiAvatar-root': {
              width: 30,
              height: 30,
              fontSize: '16px',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              '&:first-of-type': { bgcolor: '#a4b0be' }
            }
          }}
        >
          <Tooltip title="iamlddt">
            <Avatar alt="iamlddt" src={Image} />
          </Tooltip>
          <Tooltip title="iamlddt">
            <Avatar alt="iamlddt" src={Image} />
          </Tooltip>
          <Tooltip title="iamlddt">
            <Avatar alt="iamlddt" src={Image} />
          </Tooltip>
          <Tooltip title="iamlddt">
            <Avatar alt="iamlddt" src={Image} />
          </Tooltip>
        </AvatarGroup>
      </Box>
    </Box>
  )
}

export default BoardBar
