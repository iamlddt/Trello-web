import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'

import {
  DndContext,
  // PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useEffect, useState } from 'react'

function BoardContent({ board }) {
  //Nếu dùng pointerSensor thì mặc định phải két hợp Css touch-action: none ở những phần tử kéo thả - nhưng còn bug
  // const pointerSensor = useSensor(PointerSensor, {
  //   activationConstraint: { distance: 10 }
  // })

  //(ActivationConstraint):yêu cầu chuột di chuyển 10px trước khi kích hoạt dnd
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 }
  })
  //Nhấn giữ 250ms và dung sai của cảm ứng ( dễ hiểu là di chuyển/chênh lệch 5px) thì mới kích hoạt event
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 }
  })

  // const mySensors = useSensors(pointerSensor)

  //Ưu tiên sử dụng kết hợp 2 loại sensors là mouse và touch để có trải nghiệm tốt nhất trên mobile, ko bị bug
  const mySensors = useSensors(mouseSensor, touchSensor)

  const [orderedColumns, setOrderedColumns] = useState([])

  useEffect(() => {
    setOrderedColumns(mapOrder(board?.columns, board?.columnOrderIds, '_id'))
  }, [board])

  const handleDragEnd = (event) => {
    // console.log('handleDragEnd', event)
    const { active, over } = event

    //Kiểm tra nếu không tồn tại over (kéo linh tinh ra ngoài thì sẽ return để ko lỗi)
    if (!over) return

    //Nếu vị trí sau khi kéo thả khác vị trí ban đầu
    if (active.id !== over.id) {
      //Lấy vị trí cũ ( từ thằng active)
      const oldIndex = orderedColumns.findIndex(
        (column) => column._id === active.id
      )
      //Lấy vị trí mới ( từ thằng over)
      const newIndex = orderedColumns.findIndex(
        (column) => column._id === over.id
      )

      // Dùng arrayMove của dnd-kit để sắp xếp lại mảng Columns ban đầu
      const dndOrderedColumns = arrayMove(orderedColumns, oldIndex, newIndex)
      // 2 cái console.log dữ liệu này dùng để xử lý gọi API
      // const dndOrderedColumnsIds = dndOrderedColumns.map((column) => column._id)
      // console.log('dndOrderedColumns ', dndOrderedColumns)
      // console.log('dndOrderedColumnsIds ', dndOrderedColumnsIds)

      //Cập nhật lại state columns ban đầu sau khi đã kéo thả
      setOrderedColumns(dndOrderedColumns)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={mySensors}>
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
    </DndContext>
  )
}

export default BoardContent
