// Schedule 관련 API 함수 모음 — 생성, 상세 조회, 월별 목록, 일정 확정
import axiosInstance from './axiosInstance'

export const getScheduleList = async (year, month) => {
  const response = await axiosInstance.get('/sche/load/scheduleList', {
    params: { year, month },
  })
  return response.data // 배열 직접 반환 [{ id, date, title }]
}

export const createSchedule = async ({ title, place_id, people_ids, date, start_time, end_time, memo }) => {
  const response = await axiosInstance.post('/sche/create', {
    title,
    place_id: place_id || null,
    people_ids: people_ids || [],
    date,
    start_time,
    end_time,
    memo,
  })
  return response.data
}

export const getSchedule = async (scheduleId) => {
  const response = await axiosInstance.get(`/sche/${scheduleId}`)
  return response.data
}

// 일정 확정 — memo(선택)와 photos(선택, 여러 장) 를 multipart/form-data로 전송
export const updateSchedule = async (scheduleId, data) => {
  const response = await axiosInstance.patch(`/sche/${scheduleId}`, data)
  return response.data
}

export const confirmSchedule = async (scheduleId, memo, photos) => {
  const formData = new FormData()
  if (memo) formData.append('memo', memo)
  if (photos && photos.length > 0) {
    photos.forEach((photo) => formData.append('photos', photo))
  }
  const response = await axiosInstance.post(`/activity/confirm/${scheduleId}`, formData)
  return response.data
}
