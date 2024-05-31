import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'

import {
  DndContext,
  // PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  closestCorners,
  // closestCenter,
  pointerWithin,
  // rectIntersection,
  getFirstCollision
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useEffect, useState, useCallback, useRef } from 'react'

import { cloneDeep } from 'lodash'

import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

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

  //Cùng 1 thời điểm chỉ có 1 phần tử đang được kéo thả ( column hoặc card)
  const [activeDragItemId, setActiveDragItemId] = useState(null)
  const [activeDragItemType, setActiveDragItemType] = useState(null)
  const [activeDragItemData, setActiveDragItemData] = useState(null)
  const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] =
    useState(null)

  // Điểm va chạm cuối cùng trước đó
  const lastOverId = useRef(null)

  useEffect(() => {
    setOrderedColumns(mapOrder(board?.columns, board?.columnOrderIds, '_id'))
  }, [board])

  //Tìm 1 cái column theo cardId
  const findColumnByCardId = (cardId) => {
    //Đoạn này cần lưu ý, nên dùng c.cards thay vì c.cardOrderIds bởi vì ở bước handleDragOver chúng ta sẽ làm dữ liệu cho cards hoàn chỉnh trước rồi mới tạo ra card cardOrderIds mới
    return orderedColumns.find((column) =>
      column.cards.map((card) => card._id)?.includes(cardId)
    )
  }

  // Function chung xử lý việc cập nhật lại state trong trường hợp kéo thả card giữa các Column khác nhau
  const moveCardBetweenDifferentColumns = (
    overColumn,
    overCardId,
    active,
    over,
    activeColumn,
    activeDraggingCardId,
    activeDraggingCardData
  ) => {
    setOrderedColumns((preColumns) => {
      //Tìm vị trí ( Index ) của cái overCard trong column đích (nơi mà activeCard sắp được thả)
      const overCardIndex = overColumn?.cards?.findIndex(
        (card) => card._id === overCardId
      )

      //logic tính toán cardIndex mới ( trên hoặc dưới của overCard lấy từ code của thư viện dnd-kit)
      let newCardIndex
      const isBelowOverItem =
        active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height
      const modifier = isBelowOverItem ? 1 : 0
      newCardIndex =
        overCardIndex >= 0
          ? overCardIndex + modifier
          : overColumn?.cards?.length + 1

      //Clone mảng orderedColumnState cũ ra 1 cái mới để xử lý data rồi return - cập nhật lại orderedColumnState mới
      const nextColumns = cloneDeep(preColumns)
      const nextActiveColumn = nextColumns.find(
        (column) => column._id === activeColumn._id
      )
      const nextOverColumn = nextColumns.find(
        (column) => column._id === overColumn._id
      )

      //nexActiveColumn: Column cũ
      if (nextActiveColumn) {
        //Xóa card ở column active ( có thể hiểu là column cũ, cái column lúc kéo card ra khỏi nó để qua column khác)
        nextActiveColumn.cards = nextActiveColumn.cards.filter(
          (card) => card._id !== activeDraggingCardId
        )
        //Cập nhật lại mảng cardOrderIds cho chuẩn dữ liệu
        nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(
          (card) => card._id
        )
      }

      //nexOverColumn: Column mới
      if (nextOverColumn) {
        //Kiểm tra xem card đang kéo có tồn tại ở overColumn chưa, nếu có thì xóa nó trước
        nextOverColumn.cards = nextOverColumn.cards.filter(
          (card) => card._id !== activeDraggingCardId
        )

        // Phải cập nhật lại chuẩn dữ liệu columnId trong Card sau khi kéo Card giữa 2 column khác nhau
        const rebuild_activeDraggingCardData = {
          ...activeDraggingCardData,
          columnId: nextOverColumn._id
        }

        //Tiếp theo thêm cái card đang kéo vào overColumn bằng vị trí index mới
        nextOverColumn.cards = nextOverColumn.cards.toSpliced(
          newCardIndex,
          0,
          rebuild_activeDraggingCardData
        )
        //Cập nhật lại mảng cardOrderIds cho chuẩn dữ liệu
        nextOverColumn.cardOrderIds = nextOverColumn.cards.map(
          (card) => card._id
        )
      }

      return nextColumns
    })
  }

  //Trigger khi bắt đầu kéo 1 phần tử (drag)
  const handleDragStart = (event) => {
    // console.log('handleDragStart ', event)

    setActiveDragItemId(event?.active?.id)
    setActiveDragItemType(
      event?.active?.data?.current?.columnId
        ? ACTIVE_DRAG_ITEM_TYPE.CARD
        : ACTIVE_DRAG_ITEM_TYPE.COLUMN
    )
    setActiveDragItemData(event?.active?.data?.current)

    // Nếu là kéo card thì mới thực hiện hành động set giá trị oldColumn
    if (event?.active?.data?.current?.columnId) {
      setOldColumnWhenDraggingCard(findColumnByCardId(event?.active?.id))
    }
  }

  //Trigger trong quá trình kéo (drag) 1 phần tử
  const handleDragOver = (event) => {
    //Không làm gì thêm nếu đang kéo (drag) column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return

    //Còn nếu kéo card thì xử lý thêm để có thể kéo card qua lại giữa các column
    // console.log('handleDragOver', event)
    const { active, over } = event

    //Cần đảm bảo nếu không tồn tại active hoặc over (Khi kéo ra khỏi phạm vi container) thì không làm gì (tránh crash trang)
    if (!active || !over) return

    //activeDraggingCard: là card đang được kéo
    const {
      id: activeDraggingCardId,
      data: { current: activeDraggingCardData }
    } = active
    //overCard: Là card đang tương tác trên hoặc dưới so với card đang được kéo ở trên
    const { id: overCardId } = over

    //tìm 2 cái column theo CardId
    const activeColumn = findColumnByCardId(activeDraggingCardId)
    const overColumn = findColumnByCardId(overCardId)

    //Nếu không tồn tại 1 trong 2 column thì không làm gì hết, tránh crash trang
    if (!activeColumn || !overColumn) return

    //Khi kéo card qua column khác => xử lý logic ở đây, nếu kéo card trong cùng 1 column thì không làm gì
    //Vì đây là trường hợp xử lý lúc kéo (handleDragOver), còn xử lý lúc kéo xong xuôi thì vấn đề khác (handleDragEnd)
    if (activeColumn._id !== overColumn._id) {
      moveCardBetweenDifferentColumns(
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDraggingCardData
      )
    }
  }

  //Trigger khi kết thúc hành động kéo (drag) phần tử => hành động thả (drop)
  const handleDragEnd = (event) => {
    // console.log('handleDragEnd', event)
    const { active, over } = event

    //Kiểm tra nếu không tồn tại over (kéo linh tinh ra ngoài thì sẽ return để ko lỗi)
    if (!active || !over) return

    // XỬ LÝ KÉO THẢ CARDS
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      // console.log('Hành động kéo thả card - không làm gì cả')
      //activeDraggingCard: là card đang được kéo
      const {
        id: activeDraggingCardId,
        data: { current: activeDraggingCardData }
      } = active
      //overCard: Là card đang tương tác trên hoặc dưới so với card đang được kéo ở trên
      const { id: overCardId } = over

      //tìm 2 cái column theo CardId
      const activeColumn = findColumnByCardId(activeDraggingCardId)
      const overColumn = findColumnByCardId(overCardId)

      //Nếu không tồn tại 1 trong 2 column thì không làm gì hết, tránh crash trang
      if (!activeColumn || !overColumn) return

      // Hành động kéo thả card giữa 2 column khác nhau
      // Phải dủng tới activeDragItemData.columnId hoặc oldColumnWhenDraggingCard._id ( set vào state từ bước handleDragStart) chứ không phải activeData trong handleDragEnd này vì sau khi đi qua onDragOver tới đây là state của card đã bị cập nhật 1 lần rồi
      if (oldColumnWhenDraggingCard._id !== overColumn._id) {
        moveCardBetweenDifferentColumns(
          overColumn,
          overCardId,
          active,
          over,
          activeColumn,
          activeDraggingCardId,
          activeDraggingCardData
        )
      } else {
        //Hành động kéo thả card trong cùng 1 column

        //Lấy vị trí cũ ( từ thằng oldColumnWhenDraggingCard)
        const oldCardIndex = oldColumnWhenDraggingCard?.cards?.findIndex(
          (card) => card._id === activeDragItemId
        )
        //Lấy vị trí mới ( từ thằng overColumn)
        const newCardIndex = overColumn?.cards?.findIndex(
          (card) => card._id === overCardId
        )

        // Dùng arrayMove vì kéo card trong cùng column tương tự với logic kéo column trong 1 cái board content
        const dndOrderedCards = arrayMove(
          oldColumnWhenDraggingCard?.cards,
          oldCardIndex,
          newCardIndex
        )

        setOrderedColumns((preColumns) => {
          //Clone mảng orderedColumnState cũ ra 1 cái mới để xử lý data rồi return - cập nhật lại orderedColumnState mới
          const nextColumns = cloneDeep(preColumns)

          // Tìm tới cái column mà chúng ta muốn thả
          const targetColumn = nextColumns.find(
            (column) => column._id === overColumn._id
          )

          // cập nhật lại 2 giá trị mới là card và cardOrderIds trong cái targetColumn
          targetColumn.cards = dndOrderedCards
          targetColumn.cardOrderIds = dndOrderedCards.map((card) => card._id)

          // Trả về giá trị state mới ( chuẩn vị trí )
          return nextColumns
        })
      }
    }

    //Xử lý kéo thả Columns
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      //Nếu vị trí sau khi kéo thả khác vị trí ban đầu
      if (active.id !== over.id) {
        //Lấy vị trí cũ ( từ thằng active)
        const oldColumnIndex = orderedColumns.findIndex(
          (column) => column._id === active.id
        )
        //Lấy vị trí mới ( từ thằng over)
        const newColumnIndex = orderedColumns.findIndex(
          (column) => column._id === over.id
        )

        // Dùng arrayMove của dnd-kit để sắp xếp lại mảng Columns ban đầu
        const dndOrderedColumns = arrayMove(
          orderedColumns,
          oldColumnIndex,
          newColumnIndex
        )
        // 2 cái console.log dữ liệu này dùng để xử lý gọi API
        // const dndOrderedColumnsIds = dndOrderedColumns.map((column) => column._id)
        // console.log('dndOrderedColumns ', dndOrderedColumns)
        // console.log('dndOrderedColumnsIds ', dndOrderedColumnsIds)

        //Cập nhật lại state columns ban đầu sau khi đã kéo thả
        setOrderedColumns(dndOrderedColumns)
      }
    }

    // Những dữ liệu sau khi kéo thả này luôn phải đưa về giá trị null mặc định ban đầu
    setActiveDragItemId(null)
    setActiveDragItemType(null)
    setActiveDragItemData(null)
    setOldColumnWhenDraggingCard(null)
  }

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5'
        }
      }
    })
  }

  // Tối ưu lại thuật toán phát hiện va chạm để kéo card giữa nhiều column
  // args = arguments = Các đối số, tham số
  const collisionDetectionStrategy = useCallback(
    (args) => {
      // Trường hợp kéo thả Column thì dùng closestCorners là chuẩn nhất
      if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
        return closestCorners({ ...args })
      }
      // Tìm các điểm giao nhau , va chạm - intersections với con trỏ
      const pointerIntersections = pointerWithin(args)
      // Fix triệt để lỗi flickerring - lỗi khi kéo 1 card có image cover lớn lên trên cùng và ra khỏi phạm vi kéo thả
      if (!pointerIntersections?.length) return
      // Thuật toán phát hiện va chạm sẽ trả về 1 mảng các va chạm ở đây
      // const intersections = !!pointerIntersections?.length
      //   ? pointerIntersections
      //   : rectIntersection(args)
      // Tìm overId đầu tiên trong đám pointerIntersections ở trên
      let overId = getFirstCollision(pointerIntersections, 'id')
      // console.log('overId ', overId)
      if (overId) {
        // Nếu cái over nó là column thì sẽ tìm tới cardId gần nhất bên trong khu vực va chạm đó dựa vào thuật toán phát hiện va chạm closestCenter hoặc closestCorners đều được.
        const checkColumn = orderedColumns.find(
          (column) => column._id === overId
        )
        if (checkColumn) {
          // console.log('overId before ', overId)
          overId = closestCorners({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (container) =>
                container.id !== overId &&
                checkColumn?.cardOrderIds?.includes(container.id)
            )
          })[0]?.id
          // console.log('overId After ', overId)
        }

        lastOverId.current = overId
        return [{ id: overId }]
      }

      // Nếu overId là null thì trả về mảng rỗng, tránh crash trang
      return lastOverId.current ? [{ id: lastOverId.current }] : []
    },
    [activeDragItemType, orderedColumns]
  )

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      sensors={mySensors}
      // Nếu chỉ dùng closestCorners thì sẽ có bug Flickering + sai lệch dữ liệu
      // collisionDetection={closestCorners}
      // Tự custom nâng cao thuật toán phát hiện va chạm
      collisionDetection={collisionDetectionStrategy}
    >
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
        <DragOverlay dropAnimation={dropAnimation}>
          {!activeDragItemType && null}
          {activeDragItemId &&
            activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN && (
              <Column column={activeDragItemData} />
            )}
          {activeDragItemId &&
            activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD && (
              <Card card={activeDragItemData} />
            )}
        </DragOverlay>
      </Box>
    </DndContext>
  )
}

export default BoardContent
